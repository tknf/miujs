import type { PluginWithOptions } from "markdown-it";
import MarkdownIt from "markdown-it";

type ExternalLinksOptions = {
  internal?: {
    domains?: string[];
    target?: string;
    rel?: string;
  };
  external?: {
    class?: string;
    target?: string;
    rel?: string;
  };
};

const externalLinksPlugin: PluginWithOptions<ExternalLinksOptions> = (md, options) => {
  options = options || {};
  const internal = options.internal || {};
  const external = options.external || {};

  const internalDomains = Array.isArray(internal.domains) ? internal.domains.map((domain) => domain.toLowerCase()) : [];
  const internalTarget = internal.target || "_self";
  const internalRel = internal.rel || null;
  const externalTarget = external.target || "_self";
  const externalRel = external.rel || null;

  if (externalTarget === "_self" && internalTarget === "_self" && externalRel === null && internalRel === null) {
    return;
  }

  md.core.ruler.push("external_links", (state) => {
    state.tokens.map(applyFilter);
  });

  function applyFilter(token: any) {
    if (token.children) {
      token.children.map(applyFilter);
    }

    if (token.type === "link_open") {
      const href = token.attrGet("href");
      const internal = isInternal(href, internalDomains);

      const target = internal ? internalTarget : externalTarget;
      if (target !== "_self") {
        token.attrSet("target", target);
      }

      let classname = external.class || "";
      if (classname !== "" && !internal) {
        const existingClass = token.attrGet("class") || "";
        if (existingClass !== "") {
          classname = `${existingClass} ${classname}`;
        }
        token.attrSet("class", classname);
      }

      let rel = internal ? internalRel : externalRel;
      if (rel) {
        const existingRel = token.attrGet("rel") || "";
        if (existingRel !== "") {
          rel = `${existingRel} ${rel}`;
        }
        token.attrSet("rel", rel);
      }
    }
  }
};

function isInternal(href: string | null, domains: string[]) {
  if (!href) return true;
  const domain = getDomain(href);
  return domain === null || domains.includes(domain);
}

function getDomain(href: string) {
  let domain = href.split("//")[1];
  if (domain) {
    domain = domain.split("/")[0].toLowerCase();
    return domain || null;
  }
  return null;
}

const md = MarkdownIt({
  linkify: true
}).use(externalLinksPlugin, {
  external: {
    target: "_blank",
    rel: "noreferrer noopener",
    class: "external"
  }
});

export { md };
