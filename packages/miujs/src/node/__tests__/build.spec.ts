import path from "path";
import fse from "fs-extra";
import type { MiuConfig } from "../types/config";
import { loadConfig } from "../config";
import { createServerBuild } from "../compiler/builder/create-server-build";
import { createBrowserBuild } from "../compiler/builder/create-browser-build";

const rootPath = path.resolve(__dirname, "./fixtures/stack");

function generateFiles(dir: string, callback: (f: string) => void) {
  for (const filename of fse.readdirSync(dir)) {
    const file = path.resolve(dir, filename);
    const stat = fse.lstatSync(file);

    if (stat.isDirectory()) {
      generateFiles(file, callback);
    } else {
      callback(file);
    }
  }
}

describe("node:build", () => {
  let config: MiuConfig;
  beforeAll(async () => {
    config = await loadConfig(rootPath);
    fse.removeSync(config.serverBuildDirectory);
    fse.removeSync(config.clientBuildDirectory);
  });

  test("server build", async () => {
    await createServerBuild(
      config,
      {
        mode: "development",
        target: "node14",
        sourcemap: false,
        onBuildFailure: () => {},
        onWarning: () => {}
      },
      {}
    );
    const files: string[] = [];
    generateFiles(path.resolve(rootPath, config.serverBuildDirectory), (f) => files.push(f));
    expect(files).toMatchInlineSnapshot(`
      Array [
        "/Users/mast1ff/Repos/tknf/@oss/miujs/packages/miujs/src/node/__tests__/fixtures/stack/.miubuild/server/_routes/[handle].js",
        "/Users/mast1ff/Repos/tknf/@oss/miujs/packages/miujs/src/node/__tests__/fixtures/stack/.miubuild/server/_routes/index.js",
        "/Users/mast1ff/Repos/tknf/@oss/miujs/packages/miujs/src/node/__tests__/fixtures/stack/.miubuild/server/_routes/products/[handle].js",
        "/Users/mast1ff/Repos/tknf/@oss/miujs/packages/miujs/src/node/__tests__/fixtures/stack/.miubuild/server/_routes/products/index.js",
        "/Users/mast1ff/Repos/tknf/@oss/miujs/packages/miujs/src/node/__tests__/fixtures/stack/.miubuild/server/index.js",
      ]
    `);
  });

  test("assets build", async () => {
    await createBrowserBuild(config, {
      mode: "development",
      target: "node14",
      sourcemap: false,
      onBuildFailure: () => {},
      onWarning: () => {}
    });
    const files: string[] = [];
    generateFiles(path.resolve(rootPath, config.clientBuildDirectory), (f) => files.push(f));
    expect(files).toMatchInlineSnapshot(`
      Array [
        "/Users/mast1ff/Repos/tknf/@oss/miujs/packages/miujs/src/node/__tests__/fixtures/stack/.miubuild/browser/entry-client-OVLUE4AA.js",
      ]
    `);
  });
});
