/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "netlify",
  customWatchDirectories: ["./public/*.css"],
  ignoreRouteFiles: [".*"],
  clientBuildDirectory: "public/assets",
  server: "./server.js"
};
