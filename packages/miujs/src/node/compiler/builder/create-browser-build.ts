import { builtinModules as nodeBuiltins } from "module";
import path from "path";
import * as esbuild from "esbuild";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import type { MiuConfig } from "../../types/config";
import type { BuildOptions } from "../../types/compiler";
import { getDependencies, getVersion } from "../dependencies";
import { loaders } from "./esbuild-loaders";

export async function createBrowserBuild(
  config: MiuConfig,
  options: Required<BuildOptions> & {
    incremental?: boolean;
  }
): Promise<esbuild.BuildResult> {
  const dependencies = Object.keys(getDependencies(config));
  const externals = nodeBuiltins.filter((mod) => !dependencies.includes(mod));

  const entryPoints: esbuild.BuildOptions["entryPoints"] = {
    "entry-client": path.resolve(config.rootDirectory, config.entryClientFile)
  };

  const plugins: esbuild.Plugin[] = [NodeModulesPolyfillPlugin()];

  return esbuild.build({
    entryPoints,
    outdir: config.clientBuildDirectory,
    platform: "browser",
    format: "esm",
    external: externals,
    loader: loaders,
    bundle: true,
    logLevel: "silent",
    splitting: true,
    sourcemap: options.sourcemap,
    metafile: true,
    incremental: options.incremental,
    mainFields: ["browser", "module", "main"],
    treeShaking: true,
    minify: options.mode === "production",
    entryNames: `[dir]/[name]-[hash]`,
    chunkNames: `_chunks/[name]-[hash]`,
    assetNames: `_assets/[name]-[hash]`,
    publicPath: config.clientPublicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.MIUJS_DEV_SERVER_WS_PORT": JSON.stringify(8002),
      "process.env.MIUJS_VERSION": JSON.stringify(getVersion(config))
    },
    plugins
  });
}
