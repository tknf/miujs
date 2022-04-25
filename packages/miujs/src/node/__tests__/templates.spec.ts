import { PartialCache, purgeCache, ScopedStyleCache, SectionCache, setupTemplate } from "../templates";

const sections = {
  foo: {
    html: `<div></div>`,
    css: null
  }
};

const partials = {
  bar: {
    html: `<div>{{ global }}</div>`,
    css: `.root { display: block; }`
  }
};

describe("node:templates", () => {
  beforeAll(async () => {
    setupTemplate({ sections, partials });
  });

  test("setup", () => {
    expect(global.njk).toBeDefined();
  });

  test("extension", () => {
    const njk = setupTemplate({ partials, sections });

    const result = njk.renderString(`{% partial "bar", { global: "baz" } %}`, {});
    expect(result).toBe(`<div>baz</div>`);
  });

  test("purgeCache", () => {
    setupTemplate({ partials, sections });
    expect(PartialCache.size).toBe(1);
    expect(SectionCache.size).toBe(1);
    expect(ScopedStyleCache.size).toBe(1);

    purgeCache();
    expect(PartialCache.size).toBe(0);
    expect(SectionCache.size).toBe(0);
    expect(ScopedStyleCache.size).toBe(0);
  });
});
