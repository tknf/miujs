#!/usr/bin/env node

require("esm")(module);
const { performance } = require("perf_hooks");

if (!__dirname.includes("node_modules")) {
  try {
    require("source-map-support").install();
  } catch (e) {
    //
  }
}

global.__MIUJS_START_TIME = performance.now();

function start() {
  require("../dist/node/cli");
}

start();
