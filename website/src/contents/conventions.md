---
index: 5
handle: "conventions"
title: "Conventions"
prev:
  url: "/templating"
  text: "Templating"
next:
  url: "/core-api"
  text: "Core API"
published: false
---

# Conventions

## miu.config.js
This file has a build and development configuration, but does not actually run on your server.

```js
/**
 * @type { import("miujs/node).ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "node",
  customWatchDirectories: ["./public/*.css"],
  ignoreRouteFiles: [".*"]
}
```

### sourceDirectory
The path to the MiuJS source files directory.
```js
// default
exports.sourceDirectory = "src";

// custom
exports.sourceDIrectory = "app";
```

### routesDirectory
The path to the route files directory, relative to `sourceDirectory`.
Default: `"routes"`.

### layoutsDirectory
The path to the layout files directory, relative to `sourceDirectory`.
Default: `"layouts"`.

### sectionsDirectory
The path to the section files directory, relative to `sourceDirectory`.
Default: `"sections"`.

### partialsDirectory
The path to the partial files directory, relative to `sourceDirectory`.
Default: `"partials"`.

### themeDirectory
The path to the theme config files directory, relative to `sourceDirectory`.
Default: `"theme"`.

### markdown
The Configuration for markdown content build.
```js
exports.markdown = {
  enable: false,
  contentsDirectory: "src/contents"
};
```

### serverBuildDirectory
The path to the server build directory, relative to `miu.config.js`.
Default: `".miubuild/server"`.

### serverModuleFormat
Output format of server build. Defaults to `"cjs"`.  
The `serverModuleFormat` can be one of the following:
- `"cjs"`
- `"esm"`

### serverBuildTarget
The target of server build and deploy. Defaults to `"node"`.  
The `serverBuildTarget` can be one of the following:
- `"node"`
- `"vercel"`
- `"netlify"`

### server
A server entrypoint, relative to the root directory.

### clientBuildDirectory
The path to the client build directory, relative to `miu.config.js`.
Default: `".miubuild/client"`.

### entryClientFile
The path to the client JavaScript entry fliename without extensions, relative to `miu.config.js`.  
Default: `"src/entry-client"`

### entryServerFile
The path to the MiuJS server entrypoint fliename without extensions, relative to `miu.config.js`.  
Default: `"src/entry-server"`

### customWatchDirectories
This is an array of string that your custom directories to watch in dev server, relative to `miu.config.js`.

### ignoreRouteFiles
This is an array of glob pattern that MiuJS will match to files in the `routes` directory.

## File name conventions
### Special files
- `miu.config.js`
- `src/entry-server.js`
- `src/entry-client.js`

### Route files

### Template files

### Theme files

## Entry files
### entry-server.js
### entry-client.js

## Route modules
### Allowed methods

***