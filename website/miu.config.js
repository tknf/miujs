/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "vercel",
  customWatchDirectories: ["./public/*.css"],
  ignoreRouteFiles: ["**/.*"],
  clientEntries: {
    "entry-client": "src/entry-client.ts"
  },
  clientBuildDirectory: "public/assets",
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined,
  markdown: {
    enable: true
  }
};
