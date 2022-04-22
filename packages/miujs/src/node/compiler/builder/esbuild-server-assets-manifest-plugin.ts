import type { Plugin } from "esbuild";
import jsesc from "jsesc";
import type { AssetsManifestPromiseRef } from "../../types/compiler";
import { ASSETS_MANIFEST_VIRTUAL_MODULE } from "../virtual-modules";

export function serverAssetsManifestPlugin(ref: AssetsManifestPromiseRef): Plugin {
  const filter = ASSETS_MANIFEST_VIRTUAL_MODULE.filter;

  return {
    name: `server-assets-manifest`,
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: `server-assets-manifest`
        };
      });

      build.onLoad({ filter }, async () => {
        const manifest = await ref.current;

        if (manifest) {
          return {
            contents: `export default ${jsesc(manifest, { es6: true })}`,
            loader: "js"
          };
        }

        return {
          contents: `export default {};`,
          loader: "js"
        };
      });
    }
  };
}
