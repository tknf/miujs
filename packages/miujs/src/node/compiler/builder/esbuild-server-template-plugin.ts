import fse from "fs-extra";
import type { Plugin } from "esbuild";
import sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import { parse } from "node-html-parser";
import type { MiuConfig } from "../../types/config";

export function serverTemplatePlugin(config: MiuConfig): Plugin {
  return {
    name: `server-template`,
    setup(build) {
      const layoutFiles = new Set<string>();
      Object.keys(config.templates.layouts).forEach((t) => {
        layoutFiles.add(config.templates.layouts[t].file);
      });

      const sectionFiles = new Set<string>();
      Object.keys(config.templates.sections).forEach((t) => {
        sectionFiles.add(config.templates.sections[t].file);
      });

      const partialFiles = new Set<string>();
      Object.keys(config.templates.partials).forEach((t) => {
        partialFiles.add(config.templates.partials[t].file);
      });

      build.onResolve({ filter: /.*/ }, (args) => {
        if (layoutFiles.has(args.path) || sectionFiles.has(args.path) || partialFiles.has(args.path)) {
          return {
            path: args.path,
            namespace: "template"
          };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "template" }, async (args) => {
        const file = args.path;
        const contents = await fse.readFile(file, "utf-8");

        if (!/\S/.test(contents)) {
          return {
            contents: `export default {}`,
            loader: "js"
          };
        }

        // layouts
        let code: string;
        if (layoutFiles.has(file)) {
          code = `export default {
            html: ${JSON.stringify(contents)},
            css: null
          }`;
        }

        // sections or partials
        if (sectionFiles.has(file) || partialFiles.has(file)) {
          const dom = parse(contents, {
            comment: true
          });

          /**
           * Scoped process
           * ex.
           * <style scoped lang="scss">
           *   :scope {
           *     display: block;
           *   }
           * </style>
           * <template>
           *   <div></div>
           * </template>
           */

          const style = dom.querySelector(`> style`);
          const template = dom.querySelector(`> template`);
          if (style && template) {
            // style
            if (typeof style.getAttribute("scoped") !== "undefined") {
              const scopehash = generateScopeHash();
              const scopeAttr = `data-m-${scopehash}`;
              style.removeAttribute("scoped");
              style.textContent = style.textContent.replace(/:scope/g, `[${scopeAttr}]`);

              template.querySelectorAll("*").forEach((el) => {
                if (el.rawTagName !== "script") {
                  el.setAttribute(scopeAttr, "");
                }
              });
            }

            if (style.getAttribute("lang") === "scss") {
              style.textContent = sass.compileString(style.textContent).css.toString();
            }
            const styleText = await postcss([autoprefixer(), cssnano({ preset: "default" })]).process(
              style.textContent
            );
            style.textContent = styleText.css;

            code = `export default {
              html: ${JSON.stringify(template.innerHTML)},
              css: ${JSON.stringify(style.textContent)}
            }`;
          } else {
            code = `export default {
              html: ${JSON.stringify(contents)},
              css: null
            }`;
          }
        } else {
          code = `export default {
            html: ${JSON.stringify(contents)},
            css: null
          }`;
        }

        return {
          contents: code,
          loader: "js"
        };
      });
    }
  };
}

function generateScopeHash() {
  const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;
  return Array.from(Array(8))
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}
