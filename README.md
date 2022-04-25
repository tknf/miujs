# MiuJS Web Framework

A simple and minimal web framework using the JavaScript and Node.js.

Featuring:
- builtin server
- multiple deploy target
  - node
  - vercel
  - netlify
- scoped css
- live reload
- no dependencies in client bundle
- TypeScript support

## Getting Started
```bash
npx create-miu@latest
```

## Minimal example:
### Input
```js
// src/routes/index.js
import { render } from "miujs/node";

export const get = ({ createContent }) => {
  const html = createContent({
    layout: "default",
    sections: [
      { name: "index" }
    ],
    metadata: { title: "homepage" },
    data: {
      title: "My first website",
      content: "Thanks for visiting!"
    }
  });
  return render(html, {
    status: 200
  });
};
```

```html
<!-- src/layouts/default.njk -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>{{ metadata.title }}</title>
    <!-- style -->
  </head>
  <body>
    <!-- content -->
    <!-- assets -->
    <live-reload></live-reload>
  </body>
</html>
```

```html
<!-- src/sections/index.njk -->
<style scoped lang="scss">
  .root:scope {
    display: block;
    width: 100%;
    position: relative;

    .title {
      margin-top: 0;
      font-size: 2.8rem;
    }
  }
</style>

<div class="root">
  <h1 class="title">
    {{ data.title }}
  </h1>
  <p>
    {{ data.description }}
  </p>
</div>
```

## Documentation
Learn more about MiuJS on [our website](https://www.miujs.com).
