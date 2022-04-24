import path from "path";
import fse from "fs-extra";
import * as esbuild from "esbuild";
import debounce from "lodash.debounce";
import chokidar from "chokidar";
import type { MiuConfig } from "../types/config";
import type {
  BuildMode,
  BuildOptions,
  WatchOptions,
  AssetsManifest,
  AssetsManifestPromiseRef
} from "../types/compiler";
import * as logger from "../logger";
import { loadConfig } from "../config";
import { purgeRiotCache } from "../riot";
import { createServerBuild } from "./builder/create-server-build";
import { createBrowserBuild } from "./builder/create-browser-build";
import { createAssetsManifest } from "./builder/create-assets-manifest";
import { writeFileSafe } from "./compiler-utils";

/**
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  exec
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

export async function build(
  config: MiuConfig,
  {
    mode = "production",
    target = "node14",
    sourcemap = false,
    onWarning = defaultWarning,
    onBuildFailure = defaultFailure
  }: BuildOptions = {}
): Promise<void> {
  const ref: AssetsManifestPromiseRef = {};
  await buildEverything(config, { mode, target, sourcemap, onWarning, onBuildFailure }, ref);
}

export async function watch(
  config: MiuConfig,
  {
    mode = "development",
    target = "node14",
    sourcemap = true,
    onWarning = defaultWarning,
    onBuildFailure = defaultFailure,
    onRebuildStart,
    onRebuildFinish,
    onFileCreated,
    onFileChanged,
    onFileDeleted,
    onInitialBuild
  }: WatchOptions = {}
): Promise<() => Promise<void>> {
  const options = {
    mode,
    target,
    sourcemap,
    onWarning,
    onBuildFailure,
    incremental: true
  };

  const ref: AssetsManifestPromiseRef = {};
  let [browserBuild, serverBuild] = await buildEverything(config, options, ref);

  let initialBuildComplete = !!browserBuild && !!serverBuild;
  if (initialBuildComplete) {
    onInitialBuild?.();
  }

  function disposeBuilders() {
    browserBuild?.rebuild?.dispose();
    serverBuild?.rebuild?.dispose();
    browserBuild = undefined;
    serverBuild = undefined;
  }

  const restartBuilders = debounce(async (newConfig?: MiuConfig) => {
    disposeBuilders();
    try {
      purgeRiotCache();
      newConfig = await loadConfig(config.rootDirectory);
    } catch (err) {
      onBuildFailure(err as Error);
      return;
    }

    config = newConfig;

    if (onRebuildStart) {
      onRebuildStart();
    }

    const builders = await buildEverything(config, options, ref);

    if (onRebuildFinish) {
      onRebuildFinish();
    }

    browserBuild = builders[0];
    serverBuild = builders[1];
  }, 500);

  const rebuildEverything = debounce(async () => {
    if (onRebuildStart) {
      onRebuildStart();
    }

    if (!browserBuild?.rebuild || !serverBuild?.rebuild) {
      disposeBuilders();

      try {
        [browserBuild, serverBuild] = await buildEverything(config, options, ref);

        if (!initialBuildComplete) {
          initialBuildComplete = !!browserBuild && !!serverBuild;
          if (initialBuildComplete) {
            onInitialBuild?.();
          }
        }

        if (onRebuildFinish) {
          onRebuildFinish();
        }
      } catch (err: any) {
        onBuildFailure(err);
      }
      return;
    }

    const browserBuildPromise = browserBuild.rebuild();
    const assetsManifestPromise = browserBuildPromise.then((build) => generateAssetsManifest(config, build.metafile!));

    ref.current = assetsManifestPromise;

    await Promise.all([
      assetsManifestPromise,
      serverBuild.rebuild().then((build) => writeServerBuildResult(config, build.outputFiles!))
    ]).catch((err) => {
      disposeBuilders();
      onBuildFailure(err);
    });

    if (onRebuildFinish) {
      onRebuildFinish();
    }
  }, 100);

  const nodeModulesPath = path.resolve(config.rootDirectory, "node_modules");
  const toWatch = [config.sourceDirectory, nodeModulesPath];
  if (config.serverEntryPoint) {
    toWatch.push(config.serverEntryPoint);
  }
  if (config.customWatchDirectories) {
    for (const dir of config.customWatchDirectories) {
      toWatch.push(path.resolve(config.rootDirectory, dir));
    }
  }

  const ignored = [config.clientBuildDirectory, config.serverBuildDirectory];

  const watcher = chokidar
    .watch(toWatch, {
      ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    })
    .on("error", (err) => logger.error(String(err)))
    .on("change", async (file) => {
      if (onFileChanged) onFileChanged(file);

      if (isRouteFile(config, file) || isTemplateFile(file)) {
        await restartBuilders();
      } else {
        await rebuildEverything();
      }
    })
    .on("add", async (file) => {
      if (onFileCreated) onFileCreated(file);

      let newConfig: MiuConfig;
      try {
        newConfig = await loadConfig(config.rootDirectory);
      } catch (err) {
        onBuildFailure(err);
        return;
      }

      if (isEntryPoint(newConfig, file) || isRouteFile(newConfig, file) || isTemplateFile(file)) {
        await restartBuilders(newConfig);
      } else {
        await rebuildEverything();
      }
    })
    .on("unlink", async (file) => {
      if (onFileDeleted) onFileDeleted(file);

      if (isEntryPoint(config, file) || isRouteFile(config, file) || isTemplateFile(file)) {
        await restartBuilders();
      } else {
        await rebuildEverything();
      }
    });

  return async () => {
    await watcher.close().catch(() => {});
    disposeBuilders();
  };
}

/**
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  compile
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

async function buildEverything(
  config: MiuConfig,
  options: Required<BuildOptions> & {
    incremental?: boolean;
  },
  ref: AssetsManifestPromiseRef
): Promise<[esbuild.BuildResult, esbuild.BuildResult] | [undefined, undefined]> {
  try {
    const browserBuildPromise = createBrowserBuild(config, options);
    const assetsManifestPromise = browserBuildPromise.then((build) => generateAssetsManifest(config, build.metafile!));

    ref.current = assetsManifestPromise;

    const serverBuildPromise = createServerBuild(config, options, ref);

    return await Promise.all([assetsManifestPromise.then(() => browserBuildPromise), serverBuildPromise]);
  } catch (err) {
    options.onBuildFailure(err as Error);
    return [undefined, undefined];
  }
}

/**
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  Utilities
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

function defaultWarning(message: string, key: string) {
  logger.warnOnce(false, `${message} ${key}`);
}

function defaultFailure(failure: Error | esbuild.BuildFailure) {
  if ("warnings" in failure || "errors" in failure) {
    if (failure.warnings) {
      const messages = esbuild.formatMessagesSync(failure.warnings, {
        kind: "warning",
        color: true
      });
      logger.warn(messages.join(" "));
    }

    if (failure.errors) {
      const messages = esbuild.formatMessagesSync(failure.errors, {
        kind: "error",
        color: true
      });
      logger.error(messages.join(" "));
    }
  }

  logger.error(failure?.message || `An unknown build error occurred`);
}

async function generateAssetsManifest(config: MiuConfig, metafile: esbuild.Metafile): Promise<AssetsManifest> {
  const assetsManifest = await createAssetsManifest(config, metafile);
  const filename = `manifest-${assetsManifest.version.toUpperCase()}`;

  assetsManifest.url = config.clientPublicPath + filename;
  await writeFileSafe(
    path.join(config.clientBuildDirectory, filename),
    `window.__MIUJS_ASSETS_MANIFEST=${JSON.stringify(assetsManifest)}`
  );

  return assetsManifest!;
}

export function isBuildMode(mode?: string): mode is BuildMode {
  return mode === "development" || mode === "production" || mode === "test";
}

function isEntryPoint(config: MiuConfig, file: string) {
  const srcFile = path.relative(config.sourceDirectory, file);

  if (srcFile === config.entryClientFile || srcFile === config.entryServerFile) {
    return true;
  }

  return false;
}

function isRouteFile(config: MiuConfig, file: string) {
  const srcFile = path.relative(config.sourceDirectory, file);

  if (srcFile.startsWith(config.relativePath.routes)) {
    return true;
  }

  return false;
}

function isTemplateFile(file: string) {
  if (file.endsWith(".riot") || file.endsWith(".html") || file.endsWith(".md")) {
    return true;
  }

  return false;
}

async function writeServerBuildResult(config: MiuConfig, outputFiles: esbuild.OutputFile[]) {
  await fse.ensureDir(path.dirname(config.serverBuildPath));

  for (const file of outputFiles) {
    if (file.path.endsWith(".js")) {
      // fix sourceMappingURL to be relative to current path instead of /build
      const filename = file.path.substring(file.path.lastIndexOf("/") + 1);
      const escapedFilename = filename.replace(/\./g, "\\.");
      const pattern = `(//# sourceMappingURL=)(.*)${escapedFilename}`;
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(new RegExp(pattern), `$1${filename}`);
      await fse.writeFile(file.path, contents);
    } else if (file.path.endsWith(".map")) {
      // remove route: prefix from source filenames so breakpoints work
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(/"route:/gm, '"');
      await fse.writeFile(file.path, contents);
    }
  }
}
