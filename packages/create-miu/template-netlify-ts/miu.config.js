/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "netlify",
  customWatchDirectories: ["./public/*.css"],
  ignoreRouteFiles: [".*"],
  clientBuildDirectory: "public/assets",
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined
};
