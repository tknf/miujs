---
index: 3
handle: "routing"
title: "Routing"
prev:
  url: "/get-started"
  text: "Get started"
next:
  url: "/templating"
  text: "Templating"
published: true
---

# Routing
MiuJS's routing is very simple. As studied in previous section, simply export the function with the HTTP method name in a file under `src/routes`.

## File system routing
MiuJS, like Next.js and Remix, determines the routing URL by the file name under `src/routes`. As a framework for small websites, its specification is simple.
  
Input:
```bash
└── routes
  └── posts
    └── [handle].js
    └── index.js
  └── index.js
```
Result:
```bash
/          ... routes/index.js
/posts     ... routes/posts/index.js
/posts/foo ... routes/posts/[handle].js
```

## Response
Working with `Response` object in Node.js is a bit more complicated.  
Therefore MiuJS package provides commonly used response utility functions.

### HTML view response
The `render` function can create a `Response` object that renders HTML by passing an HTML string and the result of a response such as status or headers (`ResponseInit`).
```js
import { render } from "miujs/node";

export function get({ createContent }) {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <title>My first website</title>
    </head>
    <body>
      <h1>Hello world</h1>
    </body>
  </html>
  `;

  return render(html, {
    status: 200
  });
}
```

### JSON response
The `json` function can be used to create JSON responses for use in APIs, etc. Usage is the same as for `render`, just pass a JSON object.
```js
import { json } from "miujs/node";

export function get() {
  return json({ message: "hello!" }, {
    status: 200
  });
}
```

### Redirects
To process redirects, specify the `redirect`, which is accomplished by simply entering the URL to be redirected to.
```js
import { redirect } from "miujs/node";

export function get() {
  return redirect("/foo");
}
```

## Header generation
Generic header values can be generated using functions provided by MiuJS.

### Content-Type
```js
import { getContentTypeHeader, TextHtml, ApplicationJson, ApplicationPdf, ApplicationXml } from "miujs/node";

getContentTypeHeader(); // "content-type"
TextHtml(); // "text/html; charset=utf-8"
ApplicationJson(); // "application/json; charset=utf-8"
ApplicationPdf(); // "application/pdf; charset=utf-8"
ApplicationXml(); // "application/xml; charset=utf-8"

export function get() {
  return new Response({}, {
    headers: {
      [getContentTypeHeader()]: ApplicationJson()
    }
  });
}
```

### Cache-Control
```js
import { getCacheControlHeader, CacheSeconds, CacheMinutes, CacheHours, CacheDays, CacheWeeks, CacheCustom } from "miujs/node";

getCacheControlHeader(); // "cache-control"
CacheSeconds(); // "public, max-age=1, stale-while-revalidate=9"
CacheMinutes(); // "public, max-age=900, stale-while-revalidate=900"
CacheHours(); // "public, max-age=1800, stale-while-revalidate=1800"
CacheDays(); // "public, max-age=3600, stale-while-revalidate=82800"
CacheWeeks(); // "public, max-age=1296000, stale-while-revalidate=1296000"
CacheCustom({ mode: "public", sMaxAge: 60, staleWhileRevalidate: 60 }); // "public, s-maxage=60, stale-while-revalidate=60"

export function get() {
  return new Response({}, {
    headers: {
      [getCacheControlHeader()]: CacheSeconds()
    }
  });
}
```

### URL query and params
The URL query and params are passed as arguments to each method, respectively.  
Example:
```js
// src/routes/posts/[handle].js
export function get({ query, params }) {
  console.log(`query: `, query);
  console.log(`params: `, params);
  return new Response(null, {
    status: 200
  });
}
```
```bash
# http://localhost:3000/posts/foo?bar=baz
query: { bar: "baz" }
params: { handle: "foo" }
```


***