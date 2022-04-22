import path from "path";
import { loadConfig } from "../config";

const rootPath = path.resolve(__dirname, "./fixtures/stack");

describe("node:config", () => {
  test("load config", async () => {
    const config = await loadConfig(rootPath);

    expect(config).toMatchInlineSnapshot(`
      Object {
        "clientBuildDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/.shibakit/browser",
        "clientPublicPath": "/assets/",
        "customWatchDirectories": undefined,
        "entryClientFile": "src/entry-client.ts",
        "entryServerFile": "src/entry-server.ts",
        "layoutsDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/layouts",
        "partialsDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/partials",
        "relativePath": Object {
          "entryClient": "src/entry-client.ts",
          "layouts": "layouts",
          "partials": "partials",
          "routes": "routes",
          "sections": "sections",
        },
        "rootDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack",
        "routes": Object {
          "index": Object {
            "file": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/routes/index.ts",
            "id": "index",
            "path": "/",
          },
          "products/[handle]": Object {
            "file": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/routes/products/[handle].ts",
            "id": "products/[handle]",
            "path": "/products/:handle",
          },
          "products/index": Object {
            "file": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/routes/products/index.ts",
            "id": "products/index",
            "path": "/products",
          },
        },
        "routesDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/routes",
        "sectionsDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/sections",
        "serverBuildDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/.shibakit/server",
        "serverBuildPath": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/.shibakit/server/index.js",
        "serverBuildTarget": "node",
        "serverBuildTargetEntryModule": "export * from \\"shibakit-server-build\\"",
        "serverEntryPoint": undefined,
        "serverModuleFormat": "cjs",
        "sourceDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src",
        "templates": Object {
          "layouts": Object {
            "default": Object {
              "file": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/layouts/default.html",
            },
          },
          "partials": Object {
            "card": Object {
              "file": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/partials/card.html",
            },
          },
          "sections": Object {},
        },
        "themeDirectory": "/Users/mast1ff/Repos/tknf/@oss/shibakit/packages/shibakit/src/node/__tests__/fixtures/stack/src/theme",
      }
    `);
  });
});
