import type { Extension } from "nunjucks";
import { Environment, runtime } from "nunjucks";
import type { TemplateBuild } from "./types/server-build";
import * as logger from "./logger";
import { RenderContext, RenderSection } from "./types/render";

declare global {
  var njk: Environment;
}

export const PartialCache = new Map<string, TemplateBuild>();
export const SectionCache = new Map<string, TemplateBuild>();
export const ScopedStyleCache = new Map<string, string>();

class TemplateExtension implements Extension {
  constructor() {}

  tags: string[] = ["section", "partial"];
  prefix = "";
  cache: Map<string, TemplateBuild> = new Map();
  tag = "";

  parse(parser: any, nodes: any, lexer: any) {
    const token = parser.nextToken();
    this.tag = token.value;
    const args = parser.parseSignature(null, true);

    parser.advanceAfterBlockEnd(token.value);

    return new nodes.CallExtension(this, "run", args, null);
  }

  run(context: any, partialName: string, data = {}) {
    const composedData = Object.assign({}, context.ctx, data);

    let template = "";
    if (this.tags.includes(this.tag) && this.cache.has(partialName)) {
      const block = this.cache.get(partialName)!;
      if (!ScopedStyleCache.has(`${this.prefix}-${partialName}`) && block.css) {
        ScopedStyleCache.set(`${this.prefix}-${partialName}`, block.css);
      }
      template = context.env.renderString(block.html, composedData);
    }

    return new runtime.SafeString(template);
  }
}

class SectionExtension extends TemplateExtension {
  constructor() {
    super();
    this.tags = ["section"];
    this.prefix = `section`;
    this.cache = SectionCache;
  }
}

class PartialExtension extends TemplateExtension {
  constructor() {
    super();
    this.tags = ["partial"];
    this.prefix = `partial`;
    this.cache = PartialCache;
  }
}

export function setupTemplate({
  partials,
  sections
}: {
  partials: Record<string, TemplateBuild>;
  sections: Record<string, TemplateBuild>;
}) {
  if (global.njk) {
    return global.njk;
  }

  Object.keys(partials).forEach((name) => {
    PartialCache.set(name, partials[name]);
  });

  Object.keys(sections).forEach((name) => {
    SectionCache.set(name, sections[name]);
  });

  const njk = new Environment();
  njk.addExtension("section", new SectionExtension());
  njk.addExtension("partial", new PartialExtension());

  global.njk = njk;

  return njk;
}

export function render(layout: TemplateBuild, sections: RenderSection[], context: RenderContext) {
  if (!global.njk) {
    throw new Error(`Please call \"setupTemplate\" and initialize template engine.`);
  }

  const content = sections
    .map((section) => {
      return global.njk.renderString(`{% section "${section.name}" %}`, {
        ...context,
        settings: section.settings
      });
    })
    .join("");

  return renderRaw(layout, content, context);
}

export function renderRaw(layout: TemplateBuild, content: string, context: RenderContext) {
  const html = global.njk.renderString(layout.html, context);

  let style = "";
  ScopedStyleCache.forEach((val) => {
    style += val;
  });

  if (!global.njk) {
    throw new Error(`Please call \"setupTemplate\" and initialize template engine.`);
  }

  let result = html
    .replace(/<!-- *?content *?-->/, content)
    .replace(/<!-- *?style *?-->/, `<style>${style}</style>`)
    .replace(
      /<!-- *?assets *?-->/,
      `<script type="module" src="${context.assets?.entry?.module}" defer="defer"></script>`
    );

  if (context.__raw_html) {
    result = result.replace(/<!-- *?raw_html *?-->/, context.__raw_html);
  }

  return result;
}

export function purgeCache() {
  SectionCache.clear();
  PartialCache.clear();
  ScopedStyleCache.clear();
  // @ts-ignore
  global.njk = undefined;
  logger.info(`Template cache cleared`);
}
