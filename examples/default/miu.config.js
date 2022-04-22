/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "node",
  customWatchDirectories: ["../../node_modules/miujs", "./public/*.css"],
  ignoreRouteFiles: [".*"]
  // server: process.env.NODE_ENV === "production" ? "./server.js" : undefined
};
