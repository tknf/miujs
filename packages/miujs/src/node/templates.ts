import { Picx } from "picx";
import type { AssetsManifest } from "./types/server-build";
import { RenderContext } from "./types/render";

declare global {
  var __picx__: Picx;
}

export function setupPicx({
  routes,
  partials,
  layouts,
  assets
}: {
  routes: Record<string, string>;
  layouts: Record<string, string>;
  partials: Record<string, string>;
  assets: AssetsManifest;
}) {
  const picx = new Picx({
    fs: {
      readFileSync(file) {
        let content = `file "${file}" is not found.`;
        const routesReg = /^routes\//;
        const layoutsReg = /^layouts\//;
        const partialsReg = /^partials\//;
        if (routesReg.test(file) && routes[file.replace(routesReg, "")]) {
          content = routes[file.replace(routesReg, "")];
        } else if (layoutsReg.test(file) && layouts[file.replace(layoutsReg, "")]) {
          content = layouts[file.replace(layoutsReg, "")];
        } else if (partialsReg.test(file) && partials[file.replace(partialsReg, "")]) {
          content = partials[file.replace(partialsReg, "")];
        }
        return content;
      },
      async readFile(file) {
        let content = `file "${file}" is not found.`;
        const routesReg = /^routes\//;
        const layoutsReg = /^layouts\//;
        const partialsReg = /^partials\//;
        if (routesReg.test(file) && routes[file.replace(routesReg, "")]) {
          content = routes[file.replace(routesReg, "")];
        } else if (layoutsReg.test(file) && layouts[file.replace(layoutsReg, "")]) {
          content = layouts[file.replace(layoutsReg, "")];
        } else if (partialsReg.test(file) && partials[file.replace(partialsReg, "")]) {
          content = partials[file.replace(partialsReg, "")];
        }
        return content;
      },
      existsSync() {
        return true;
      },
      async exists() {
        return true;
      },
      dirname(file) {
        return file;
      },
      contains() {
        return true;
      },
      resolve(_root, file, _ext) {
        return file;
      },
      sep: "/"
    }
  });

  picx.registerFilter("assets", (key) => {
    if (assets.entries[key]) {
      return assets.entries[key].module;
    }
    return "";
  });

  return picx;
}

export function render(engine: Picx, route: string, context: RenderContext) {
  let html = engine.renderFileSync(route, context);
  if (context.__raw_html) {
    html = html.replace(/<!-- *?raw_html *?-->/, context.__raw_html);
  }
  return html;
}

export function renderRaw(engine: Picx, content: string, context: RenderContext) {
  let html: string = engine.parseAndRenderSync(content, context);

  if (context.__raw_html) {
    html = html.replace(/<!-- *?raw_html *?-->/, context.__raw_html);
  }

  return html;
}
