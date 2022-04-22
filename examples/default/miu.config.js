/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "netlify",
  customWatchDirectories: ["../../node_modules/miujs", "./public/*.css"],
  ignoreRouteFiles: [".*"],
  clientBuildDirectory: "public/assets",
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined
};
