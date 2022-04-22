import path from "path";
import fse from "fs-extra";
import type { Plugin } from "esbuild";
import type { MiuConfig } from "../../types/config";
import { getLoaderForFile } from "./esbuild-loaders";

export function serverRouteModulesPlugin(config: MiuConfig): Plugin {
  return {
    name: `server-route-modules`,
    setup(build) {
      const routeFiles = new Set(
        Object.keys(config.routes).map((key) => path.resolve(config.rootDirectory, config.routes[key].file))
      );

      build.onResolve({ filter: /.*/ }, (args) => {
        if (routeFiles.has(args.path)) {
          return { path: args.path, namespace: "route" };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "route" }, async (args) => {
        const file = args.path;
        const contents = await fse.readFile(file, "utf-8");

        if (!/\S/.test(contents)) {
          return {
            contents: `export default () => null`,
            loader: "js"
          };
        }

        return {
          contents,
          resolveDir: path.dirname(file),
          loader: getLoaderForFile(file)
        };
      });
    }
  };
}
