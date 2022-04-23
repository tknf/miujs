import * as riot from "riot";
import * as ssr from "@riotjs/ssr";
import type { RiotComponentWrapper } from "riot";
import type { RenderSection } from "./types/render";
import * as logger from "./logger";

export const SectionCache = new Map<string, RiotComponentWrapper>();

export function setupRiot({
  partials,
  sections
}: {
  partials: Record<string, RiotComponentWrapper>;
  sections: Record<string, RiotComponentWrapper>;
}) {
  Object.keys(partials).forEach((name) => {
    try {
      riot.register(name, partials[name]);
      // console.log(`> partial registered: ${name}`);
    } catch {
      riot.unregister(name);
      riot.register(name, partials[name]);
      // console.log(`> partial registered: ${name}`);
    }
  });

  Object.keys(sections).forEach((name) => {
    const $name = `section:${name}`;
    try {
      SectionCache.set($name, sections[name]);
      riot.register($name, sections[name]);
      // console.log(`> section registered: ${$name}`);
    } catch {
      riot.unregister($name);
      SectionCache.set($name, sections[name]);
      riot.register($name, sections[name]);
      // console.log(`> section registered: ${$name}`);
    }
  });
}

export function render(layout: RiotComponentWrapper, sections: RenderSection[], context: any) {
  const content: ssr.RenderingFragments[] = sections.map((section) => {
    const name = `section:${section.name}`;
    if (SectionCache.has(name)) {
      return ssr.fragments(name, SectionCache.get(name)!, {
        ...context,
        settings: section.settings
      });
    }
    return {
      html: "",
      css: ""
    };
  });

  return renderRaw(layout, content, context);
}

export function renderRaw(layout: RiotComponentWrapper, content: string | ssr.RenderingFragments[], context: any) {
  let contentStyle = "";
  let contentHtml = "";

  if (typeof content === "string") {
    contentHtml = content;
  } else {
    contentStyle = content.map(({ css }) => css).join("");
    contentHtml = content.map(({ html }) => html).join("");
  }

  const { html, css } = ssr.fragments("html", layout, context);
  const result = html
    .replace(/<!-- *?content *?-->/, contentHtml)
    .replace(/<!-- *?style *?-->/, `<style>${css}${contentStyle}</style>`)
    .replace(
      /<!-- *?assets *?-->/,
      `<script type="module" src="${context.assets?.entry?.module}" defer="defer"></script>`
    );

  return result;
}

export function purgeRiotCache() {
  SectionCache.clear();
  logger.info(`Riot cache cleared`);
}
