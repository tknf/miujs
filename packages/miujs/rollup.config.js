/* eslint-disable import/no-named-as-default */
import path from "path";
//import fs from "fs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
//import license from "rollup-plugin-license";

function getVersion() {
  return require("./package.json").version;
}

const banner = `/**
  * MiuJS v${getVersion()}
  * 
  * Copyright (c) TKNF LLC
  * 
  * This source code is licensed under the MIT license found in the
  * LICENSE file in the root directory of thie source tree.
  * 
  * @license MIT
  */`;

/**
 * @param { boolean } isProduction
 * @returns { import("rollup").RollupOptions }
 */
const createBrowserOptions = (isProduction) => {
  /**
   * @type { import("rollup").RollupOptions }
   */
  const config = {
    input: path.resolve(__dirname, "src/browser/index.ts"),
    output: {
      dir: path.resolve(__dirname, "dist"),
      entryFileNames: `browser/[name].js`,
      chunkFileNames: `browser/chunks/[hash].js`,
      exports: "named",
      format: "cjs",
      externalLiveBindings: false,
      freeze: false,
      banner
    },
    treeshake: {
      moduleSideEffects: "no-external",
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    external: [
      ...Object.keys(require("./package.json").dependencies),
      ...Object.keys(require("./package.json").devDependencies)
    ],
    onwarn(warning, warn) {
      if (warning.message.includes("Package subpath")) {
        return;
      }
      if (warning.message.includes("Use of eval")) {
        return;
      }
      if (warning.message.includes("Circular dependency")) {
        return;
      }
      warn(warning);
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: "./tsconfig.browser.json",
        declaration: true,
        declarationDir: "./dist/browser"
      }),
      json()
    ]
  };

  return config;
};

/**
 * @type { import("rollup").RollupOptions }
 */
const sharedNodeOptions = {
  treeshake: {
    moduleSideEffects: "no-external",
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  output: {
    dir: path.resolve(__dirname, "dist"),
    exports: "named",
    format: "cjs",
    externalLiveBindings: false,
    freeze: false,
    banner
  },
  external: [
    ...Object.keys(require("./package.json").dependencies),
    ...Object.keys(require("./package.json").devDependencies)
  ],
  onwarn(warning, warn) {
    if (warning.message.includes("Package subpath")) {
      return;
    }
    if (warning.message.includes("Use of eval")) {
      return;
    }
    if (warning.message.includes("Circular dependency")) {
      return;
    }
    warn(warning);
  }
};

/**
 * @param { boolean } isProduction
 * @returns { import("rollup").RollupOptions }
 */
const createNodeOptions = (isProduction) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const config = {
    ...sharedNodeOptions,
    input: path.resolve(__dirname, "src/node/index.ts"),
    output: {
      ...sharedNodeOptions.output,
      dir: path.resolve(__dirname, "dist/node"),
      preserveModules: true,
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: "./tsconfig.node.json",
        declaration: true,
        declarationDir: "./dist/node"
      }),
      json()
      // isProduction && licensePlugin()
    ]
  };

  return config;
};

/**
 * @param { boolean } isProduction
 * @returns { import("rollup").RollupOptions }
 */
const createCliOptions = (isProduction) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const config = {
    ...sharedNodeOptions,
    input: path.resolve(__dirname, "src/node/cli.ts"),
    output: {
      ...sharedNodeOptions.output,
      entryFileNames: `node/[name].js`,
      chunkFileNames: `node/chunks/[hash].js`,
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: "./tsconfig.node.json",
        declaration: true,
        declarationDir: "./dist/node"
      }),
      commonjs({
        extensions: [".js"],
        ignore: ["bufferutil", "utf-8-validate"]
      }),
      json()
      // isProduction && licensePlugin()
    ]
  };
  return config;
};

/**
 * @param {boolean} isProduction
 * @returns {import("rollup").RollupOptions}
 */
const createServersOptions = (isProduction) => {
  /**
   * @type { import("rollup").RollupOptions }
   */
  const config = {
    ...sharedNodeOptions,
    input: {
      express: path.resolve(__dirname, "src/node/servers/express.ts"),
      connect: path.resolve(__dirname, "src/node/servers/connect.ts"),
      vercel: path.resolve(__dirname, "src/node/servers/vercel.ts"),
      netlify: path.resolve(__dirname, "src/node/servers/netlify.ts")
    },
    output: {
      ...sharedNodeOptions.output,
      entryFileNames: `node/servers/[name].js`,
      chunkFileNames: `node/servers/chunks/[hash].js`,
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: "./tsconfig.node.json",
        sourceMap: !isProduction,
        declaration: false
      }),
      commonjs({
        extensions: [".js"],
        ignore: ["bufferutil", "utf-8-validate"]
      }),
      json()
    ]
  };

  return config;
};

export default (options) => {
  const isDevelopment = options.watch;
  const isProduction = !isDevelopment;

  return [
    createNodeOptions(isProduction),
    createCliOptions(isProduction),
    createServersOptions(isProduction),
    createBrowserOptions(isProduction)
  ];
};
