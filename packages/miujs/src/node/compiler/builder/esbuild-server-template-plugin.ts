import fse from "fs-extra";
import type { Plugin } from "esbuild";
import sass from "sass";
import { compile, registerPreprocessor } from "@riotjs/compiler";
import type { MiuConfig } from "../../types/config";

export function serverTemplatePlugin(config: MiuConfig): Plugin {
  return {
    name: `server-template`,
    setup(build) {
      try {
        registerPreprocessor("css", "scss", (code, { options }) => {
          const { css } = sass.compileString(code);

          return {
            code: css.toString()
          };
        });
      } catch {
        //
      }

      const templateFiles = new Set<string>();
      Object.keys(config.templates.layouts).forEach((t) => {
        templateFiles.add(config.templates.layouts[t].file);
      });
      Object.keys(config.templates.sections).forEach((t) => {
        templateFiles.add(config.templates.sections[t].file);
      });
      Object.keys(config.templates.partials).forEach((t) => {
        templateFiles.add(config.templates.partials[t].file);
      });

      build.onResolve({ filter: /.*/ }, (args) => {
        if (templateFiles.has(args.path)) {
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

        const { code } = compile(contents, {
          scopedCss: true,
          // @ts-ignore
          comments: true,
          // @ts-ignore
          brackets: ["{{", "}}"]
        });

        return {
          contents: code,
          loader: "js"
        };
      });
    }
  };
}