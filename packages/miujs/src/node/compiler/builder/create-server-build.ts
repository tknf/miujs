import path from "path";
import * as esbuild from "esbuild";
import fse from "fs-extra";
import type { MiuConfig } from "../../types/config";
import type { BuildOptions, AssetsManifestPromiseRef } from "../../types/compiler";
import { getVersion } from "../dependencies";
import { serverEntryModulePlugin } from "./esbuild-server-entry-module-plugin";
import { serverAssetsManifestPlugin } from "./esbuild-server-assets-manifest-plugin";
import { createRouteModulesBuild } from "./create-route-modules-build";
import { loaders } from "./esbuild-loaders";

export async function createServerBuild(
  config: MiuConfig,
  options: Required<BuildOptions> & {
    incremental?: boolean;
  },
  ref: AssetsManifestPromiseRef
): Promise<esbuild.BuildResult> {
  // const dependencies = getDependencies(config);

  const plugins: esbuild.Plugin[] = [serverEntryModulePlugin(config), serverAssetsManifestPlugin(ref)];

  let entryPoints: string[] | undefined;
  let stdin: esbuild.StdinOptions | undefined;

  if (config.serverEntryPoint) {
    entryPoints = [config.serverEntryPoint];
  } else {
    stdin = {
      contents: config.serverBuildTargetEntryModule,
      resolveDir: config.rootDirectory,
      loader: "ts"
    };
  }

  await createRouteModulesBuild(config, options);

  return esbuild
    .build({
      stdin,
      entryPoints,
      absWorkingDir: config.rootDirectory,
      outfile: config.serverBuildPath,
      write: false,
      platform: "node",
      format: config.serverModuleFormat,
      treeShaking: true,
      minify: options.mode === "production",
      mainFields: config.serverModuleFormat === "esm" ? ["module", "main"] : ["main", "module"],
      target: options.target,
      loader: loaders,
      bundle: true,
      logLevel: "silent",
      incremental: options.incremental,
      sourcemap: options.sourcemap,
      define: {
        "process.env.NODE_ENV": JSON.stringify(options.mode),
        "process.env.MIUJS_DEV_SERVER_WS_PORT": JSON.stringify(8002),
        "process.env.MIUJS_VERSION": JSON.stringify(getVersion(config))
      },
      plugins
    })
    .then(async (build) => {
      await writeServerBuildResult(config, build.outputFiles);
      return build;
    });
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
