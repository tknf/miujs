import path from "path";
import * as esbuild from "esbuild";
import { MiuConfig } from "../../types/config";
import { AssetsManifest } from "../../types/compiler";
import { createUrl, getHash } from "../compiler-utils";

export async function createAssetsManifest(config: MiuConfig, metafile: esbuild.Metafile): Promise<AssetsManifest> {
  function resolveUrl(output: string): string {
    return createUrl(config.clientPublicPath, path.relative(config.clientBuildDirectory, path.resolve(output)));
  }

  function resolveImports(imports: esbuild.Metafile["outputs"][string]["imports"]): string[] {
    return imports.filter((im) => im.kind === "import-statement").map((im) => resolveUrl(im.path));
  }

  const entries: AssetsManifest["entries"] | undefined = {};
  for (const key of Object.keys(metafile.outputs).sort()) {
    const output = metafile.outputs[key];
    if (!output.entryPoint) continue;

    const entryPointFile = path.resolve(output.entryPoint);
    console.log(entryPointFile);

    for (const [assetKey, file] of Object.entries(config.clientEntries)) {
      const entryFile = path.resolve(config.rootDirectory, file);
      if (entryPointFile === entryFile) {
        entries[assetKey] = {
          module: resolveUrl(key),
          imports: resolveImports(output.imports)
        };
      }
    }
  }

  const version = getHash(JSON.stringify({ entries }).slice(0, 8));

  return {
    version,
    entries
  };
}
