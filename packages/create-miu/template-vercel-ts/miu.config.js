/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "vercel",
  customWatchDirectories: ["./public/*.css"],
  ignoreRouteFiles: [".*"],
  clientBuildDirectory: "public/assets",
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined
};
