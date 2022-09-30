/**
 * @type { import("miujs/node").ApplicationConfig }
 */
module.exports = {
  serverBuildTarget: "node",
  customWatchDirectories: ["./public/*.css"],
  ignoreRouteFiles: ["**/.*"],
  clientEntries: {
    "entry-client": "src/entry-client.ts"
  }
};
