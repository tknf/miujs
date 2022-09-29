---
index: 4
handle: "templating"
title: "Templating"
prev:
  url: "/routing"
  text: "Routing"
# next:
  # url: "/conventions"
  # text: "Conventions"
published: true
---

# Templates
MiuJS uses Nunjucks template engine for HTML markup. Please refer to the [website](https://mozilla.github.io/nunjucks/) for lerning Nunjucks notations.  
This section introduces special notation and file placement in MiuJS project.  
MiuJS projects can load `.html`, `.njk`, and `.nj` extensions.

## Partials and Sections
MiuJS stores templates created at build time in memory so that they will work in many environments. Templates are divided into `Partial` and `Section`, both of which can be called from other templates, but `Section` can also be called with special scope from the route functions.  
The `partial` and `section` behave like `include` in Nunjucks, but instead of using `fs` to read files, they are called from cached data at build time.

### Basic
Example:
```html
<!-- layouts/default.html -->
<div>
  <!-- call partial -->
  {% partial "header", { name: "Akiyoshi" } %}
  {% section "content" %}
</div>

<!-- partials/header.njk -->
<header>
  Hello {{ name }}
</header>

<!-- sections/content.njk -->
<div>
  This is content
</div>
```

Or, if the section is called from a `route` function:
```js
export function get({ createContent }) {
  const html = createContent({
    layout: "default",
    sections: [
      {
        name: "header",
        settings: {
          name: "Akiyoshi"
        }
      }
    ]
  });
  return render(html);
}
```
```html
<!-- sections/header.njk -->
<header>
  Hello {{ settings.name }}
</header>
```
The settings object then defines the data passed from each `route` function, creating a complete scope that cannot be referenced by any other templates.

### Scoped CSS
The greatest feature of MiuJS's templates is its ability to realize scoped CSS, which is often found in modern JS frameworks, using only HTML markup.
```html
<style scoped>
  .root:scope {
    position: sticky;
  }
</style>

<template>
  <div class="root"></div>
</template>
```
Templates with `<style scoped></style>` and `<template></template>` at the top level will only render innerHTML of `<template></template>` after generating scoped CSS. In this case, the CSS in `<style></style>` can be inserted using the `<!-- style -->` fragment.

### CSS compile
If `<style></style>` and `<template></tempalte>` are placed at the top level as in scoped CSS, it's compiled using `PostCSS`  
Also, if you add the `lang="scss"` attribute to the style element, it will be converted to CSS using `sass`.
```html
<!-- Input: -->
<style scoped lang="scss">
  :scope {
    position: sticky;
  }
</style>

<template>
  <div>
    Sticky!
  </div>
</template>

<!-- Output: -->
<style>
  [data-m-0vkhs1dj] {
    position: -webkit-sticky;
    position: sticky;
  }
</style>

<div data-m-0vkhs1dj>Sticky!</div>
```

## Layouts
The files in `src/layouts` are templates that serve as entry points for HTML generated by the `createContent` function.  
If the `layout` property is not specified, `default.{html,njk,nj}` is automatically referenced. Also, `404.{html,njk,nj}` and `500.{html,njk,nj}` are files that are automatically referenced in case of errors.

## Comment out fragments
Some HTML comments act as special fragments and are replaced with their respective markup at runtime.

### Content
`<!-- content -->` inserts the markup for the section generated by the `createContent` function and any runtime error text.

### Scoped CSS
`<!-- style -->` fragment inserts the generated CSS.

### Assets
Script tags that refer to client-side JavaScript compiled by MiuJS are `<!-- assets -->` fragment position.

### Raw HTML
HTML and other strings generated from markdown, etc. can be inserted as-is using `<!-- raw_html -->` fragment.

## createContent
The `createContent` function, available in functions in files under `src/routes`, can send arbitrary data to the templates.
```js
export function get({ createContent }) {
  const html = createContent({
    layout: "default", // Reference to layout file
    sections: [], // Array of sections to insert into `<!-- content -->`
    metadata: {}, // `title` and other metadata
    data: {}, // Arbitrary data
    __raw_html: "" // Unescaped raw HTML string
  });

  return render(html);
}
```

***