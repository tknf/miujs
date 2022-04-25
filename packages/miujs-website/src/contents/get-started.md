---
index: 1
handle: "get-started"
title: "Get Started"
prev:
  url: "/"
  text: "Overview"
next:
  url: "/routing"
  text: "Routing"
published: true
---

# Get Started
MiuJS is important for you to have these things installed:
- [Node.js](https://nodejs.org) 14 or greater
- [npm](https://www.npmjs.com) 7 or greater
- Your favorite code editor

## Create project
MiuJS project can be created with a single command using `create-miu` package.

✨ Create a new Miu project. In this case, we'll create it under the name "my-project", else if you'd like.
```bash
npx create-miu@latest my-project
```
```bash
npm install
```

✨ Start the dev server:
```bash
npm run dev
```

✨ Open http://localhost:3000, the application should be running.

## MiuJS project structure
When you create a MiuJS project, selected template initializes a basic file structure of a MiuJS project.
Most of the files that you'll work with in the MiuJS proejct are located in the `/src` directory. The `/src` directory contains the following:
- The custom server response modifier in `entry-server.js`. This file is also the main entry point for the server.
- A set of boilerplate routes

```bash
└── public
  └── main.css
  └── ...
└── src
  ├── layouts
    └── 404.html
    └── 500.html
    └── default.html
  ├── partials
    └── miu-icon.html
    └── ...
  ├── routes
    └── posts
      └── [handle].js
    └── index.js
  ├── sections
    └── common-header.html
    └── ...
  ├── theme
    └── config.json
  ├── entry-client.js
  ├── entry-server.js
```

## Server request flow for MiuJS
The following diagram shows the request flow for MiuJS:  

![MiuJS server request flow](/images/server_request_flow.jpg)

***

## Configuring entry points
MiuJS is includes the following entry points:
- Server entry point: `src/entry-server.js`
- Client entry point: `src/entry-client.js`

### `entry-server.js`
`createServerRequest` is only function that can perform any final processing on the response object created by MiuJS before returning it to the client.

```js
import { createServerRequest } from "miujs/node";

export default createServerRequest((request, responseStatusCode, responseHeaders, markup, context) => {
  return new Response(markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
});
```


### `entry-client.js`
Initialize the `MiuBrowser` class to register and start the browser utilities provided by MiuJS.  
Also, any client-side JavaScript process you create can be executed here.
```js
import { MiuBrowser, LiveReload, LiveFrame } from "miujs/browser";

export function main() {
  const Browser = new MiuBrowser();

  Browser.use(LiveReload);
  Browser.use(LiveFrame);

  Browser.start();
}

void main();
```
## Configuring route files
Files under `src/routes` are treated specially. By returning a `Response` object within a function involving an HTTP method name such as `get` or `post`, the MiuJS server will automatically create a routing.  
Dynamic HTML can be generated using the template engine with the `createContent` function passed to each method call.  

Input: `src/routes/index.js`
```js
export function get({ createContent }) {
  const html = createContent({
    layout: "default",
    sections: [],
    metadata: {},
    data: {}
  });

  return render(html, {
    status: 200,
    headers: {}
  });
}

export function post() {
  return new Response({ foo: "bar" }, {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
```  
  
Output:
```bash
└── /
  └── GET .... src/routes/index.js#get (text/html)
  └── POST ... src/routes/index.js#post (application/json)
```
***