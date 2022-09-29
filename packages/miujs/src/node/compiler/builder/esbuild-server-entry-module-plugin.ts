import path from "path";
import fse from "fs-extra";
import type { Plugin } from "esbuild";
import type { MiuConfig } from "../../types/config";
import { SERVER_BUILD_VIRTUAL_MODULE, ASSETS_MANIFEST_VIRTUAL_MODULE } from "../virtual-modules";

function safeJSONParse(contents: string): object {
  try {
    return JSON.parse(contents);
  } catch {
    return {};
  }
}

function createTheme(config: MiuConfig): string {
  let themeConfig: Record<string, any> = {};
  let locale: Record<string, any> = {};
  if (fse.existsSync(config.themeDirectory)) {
    const files = fse.readdirSync(config.themeDirectory);
    for (const file of files) {
      if (path.extname(file) === ".json") {
        if (file.startsWith("config.")) {
          const contents = fse.readFileSync(path.resolve(config.themeDirectory, file), "utf-8");
          themeConfig = safeJSONParse(contents);
        } else if (file.startsWith("locale.")) {
          const contents = fse.readFileSync(path.resolve(config.themeDirectory, file), "utf-8");
          if (file.includes(".default.")) {
            locale = safeJSONParse(contents);
          } else {
            const name = file
              .replace(/\.json$/, "")
              .replace(/\//i, "")
              .replace(/^locale\./i, "");
            locale[name] = safeJSONParse(contents);
          }
        }
      }
    }
  }

  return `config: ${JSON.stringify(themeConfig)}, locale: ${JSON.stringify(locale)}`;
}

function createRouteImports(config: MiuConfig): string {
  return Object.keys(config.routes)
    .map((key, index) => {
      const route = config.routes[key];
      return `import * as route_${index} from ${JSON.stringify(route.file)};`;
    })
    .join("\n");
}

function createTemplateImports(config: MiuConfig): string {
  return `
  ${Object.keys(config.templates.routes)
    .map((name, index) => {
      const file = config.templates.routes[name].file;
      return `import { default as template_route_${index} } from ${JSON.stringify(file)};`;
    })
    .join("\n")}
  ${Object.keys(config.templates.layouts)
    .map((name, index) => {
      const file = config.templates.layouts[name].file;
      return `import { default as template_layout_${index} } from ${JSON.stringify(file)};`;
    })
    .join("\n")}
  ${Object.keys(config.templates.partials)
    .map((name, index) => {
      const file = config.templates.partials[name].file;
      return `import { default as template_partial_${index} } from ${JSON.stringify(file)};`;
    })
    .join("\n")}
  `;
}

function createRouteManifest(config: MiuConfig): string {
  return Object.keys(config.routes)
    .map((key, index) => {
      const route = config.routes[key];
      return `${JSON.stringify(key)}: {
        id: ${JSON.stringify(route.id)},
        path: ${JSON.stringify(route.path)},
        module: route_${index}
    }`;
    })
    .join(",\n  ");
}

function createTemplateManifest(config: MiuConfig): string {
  const { layouts, routes, partials } = config.templates;
  return `
  routes: {${Object.keys(routes)
    .map((t, index) => `${JSON.stringify(t)}: template_route_${index}`)
    .join(",")}},
  layouts: {${Object.keys(layouts)
    .map((t, index) => `${JSON.stringify(t)}: template_layout_${index}`)
    .join(",")}},
  partials: {${Object.keys(partials)
    .map((t, index) => `${JSON.stringify(t)}: template_partial_${index}`)
    .join(",")}}
  `;
}

function createContents(config: MiuConfig): string {
  return `
import * as entryServer from ${JSON.stringify(path.resolve(config.rootDirectory, config.entryServerFile))};

${createRouteImports(config)}

${createTemplateImports(config)}

export { default as assets } from ${JSON.stringify(ASSETS_MANIFEST_VIRTUAL_MODULE.id)};

export const entry = { module: entryServer };

export const routes = {
  ${createRouteManifest(config)}
};

export const config = ${JSON.stringify(config)};

export const templates = {
  ${createTemplateManifest(config)}
};

export const theme = { ${createTheme(config)} };

${config.markdown.enable ? `export const markdownContents = ${JSON.stringify(config.markdown.contents)};` : ``}
`;
}

export function serverEntryModulePlugin(config: MiuConfig): Plugin {
  const filter = SERVER_BUILD_VIRTUAL_MODULE.filter;
  const contents = createContents(config);

  return {
    name: `server-entry-module`,
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: `server-entry-module`
        };
      });

      build.onLoad({ filter }, async () => {
        return {
          resolveDir: config.rootDirectory,
          loader: "js",
          contents
        };
      });
    }
  };
}
