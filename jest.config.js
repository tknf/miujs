const ignorePatterns = [
  "\\/build\\/",
  "\\/dist\\/",
  "\\/coverage\\/",
  "\\/\\.vscode\\/",
  "\\/\\.tmp\\/",
  "\\/\\.cache\\/"
];

/** @type {import("@jest/types").Config.InitialOptions} */
module.exports = {
  testEnvironment: "node",
  modulePathIgnorePatterns: ignorePatterns,
  watchPathIgnorePatterns: [...ignorePatterns, "\\/node_modules\\/"],
  silent: false,
  verbose: false,
  testMatch: ["**/*.(spec|test).[jt]s", "!**/*/dist/**/*", "!**/*/fixtures/**/*"],
  testTimeout: process.env.CI ? 50000 : 20000,
  transform: {
    "\\.[jt]s?$": require.resolve("./jest.babel-transformer.js")
  },
  transformIgnorePatterns: ["/node_modules/(?!(get-port|chalk)/)"]
};
