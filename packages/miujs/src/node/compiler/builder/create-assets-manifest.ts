import path from "path";
import * as esbuild from "esbuild";
import { MiuConfig } from "../../types/config";
import { AssetsManifest } from "../../types/compiler";
import { createUrl, getHash } from "../compiler-utils";
import * as logger from "../../logger";

export async function createAssetsManifest(config: MiuConfig, metafile: esbuild.Metafile): Promise<AssetsManifest> {
  function resolveUrl(output: string): string {
    return createUrl(config.clientPublicPath, path.relative(config.clientBuildDirectory, path.resolve(output)));
  }

  function resolveImports(imports: esbuild.Metafile["outputs"][string]["imports"]): string[] {
    return imports.filter((im) => im.kind === "import-statement").map((im) => resolveUrl(im.path));
  }

  const entryClientFile = path.resolve(config.rootDirectory, config.entryClientFile);

  let entry: AssetsManifest["entry"] | undefined;
  for (const key of Object.keys(metafile.outputs).sort()) {
    const output = metafile.outputs[key];
    if (!output.entryPoint) continue;

    const entryPointFile = path.resolve(output.entryPoint);

    if (entryPointFile === entryClientFile) {
      entry = {
        module: resolveUrl(key),
        imports: resolveImports(output.imports)
      };
    }
  }

  logger.invariant(entry, `Missing output for entry point`);

  const version = getHash(JSON.stringify({ entry }).slice(0, 8));

  return {
    version,
    entry: entry!
  };
}
