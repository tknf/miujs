import path from "path";
import * as esbuild from "esbuild";
import type { MiuConfig } from "../../types/config";
import type { BuildOptions } from "../../types/compiler";
import { getVersion } from "../dependencies";
import { serverRouteModulesPlugin } from "./esbuild-server-route-modules-plugin";
import { loaders } from "./esbuild-loaders";

export async function createRouteModulesBuild(
  config: MiuConfig,
  options: Required<BuildOptions> & {
    incremental?: boolean;
  }
): Promise<esbuild.BuildResult> {
  const plugins: esbuild.Plugin[] = [serverRouteModulesPlugin(config)];

  const entryPoints: esbuild.BuildOptions["entryPoints"] = {};
  for (const key in config.routes) {
    const route = config.routes[key];
    entryPoints[route.id] = path.resolve(config.rootDirectory, route.file);
  }

  return esbuild.build({
    entryPoints,
    outdir: `${config.serverBuildDirectory}/_routes`,
    absWorkingDir: config.rootDirectory,
    write: true,
    platform: "node",
    format: config.serverModuleFormat,
    treeShaking: true,
    minify: options.mode === "production",
    mainFields: config.serverModuleFormat === "esm" ? ["module", "main"] : ["main", "module"],
    target: options.target,
    loader: loaders,
    bundle: true,
    logLevel: "silent",
    sourcemap: options.sourcemap,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.MIUJS_VERSION": JSON.stringify(getVersion(config))
    },
    incremental: options.incremental,
    plugins
  });
}
