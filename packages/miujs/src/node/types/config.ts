/**
 * TODO:
 * Add target
 * - "netlify"
 * - "cloud-flare"
 */
export type ServerBuildTarget = "node" | "vercel"; // | "netlify";

export type ServerModuleFormat = "esm" | "cjs";

export interface ApplicationConfig {
  /**
   * The path to the MiuJS source files directory.\
   * Default: `"src"`
   */
  sourceDirectory?: string;

  /**
   * The path to the route files directory, relative to `sourceDirectory`.\
   * Default: `"routes"`
   */
  routesDirectory?: string;

  /**
   * The path to the section files directory, relative to `sourceDirectory`.\
   * Default: `"routes"`
   */
  layoutsDirectory?: string;

  /**
   * The path to the section files directory, relative to `sourceDirectory`.\
   * Default: `"routes"`
   */
  sectionsDirectory?: string;

  /**
   * The path to the partial files directory, relative to `sourceDirectory`.\
   * Default: `"routes"`
   */
  partialsDirectory?: string;

  /**
   * The path to the theme config files directory, relative to `sourceDirectory`.\
   * Default: `"theme"`
   */
  themeDirectory?: string;

  /**
   * The path to the server build directory, relative to `miu.config.js`.\
   * Default: `".miubuild/server"`
   */
  serverBuildDirectory?: string;

  /**
   * Output format of server build.\
   * Default: `"cjs"`
   */
  serverModuleFormat?: ServerModuleFormat;

  /**
   * The target of server build and deploy.\
   * Default: `"node"`
   */
  serverBuildTarget?: ServerBuildTarget;

  /**
   * The server entrypoint, relative to the root directory.\
   * Default: undefined
   */
  server?: string;

  /**
   * The path to the client assets build directory, relative to `miu.config.js`.\
   * Default: `".miubuild/client"`
   */
  clientBuildDirectory?: string;

  /**
   * The path to the client javascript entry filename without extensions, relative to `miu.config.js`.\
   * Default: `"app/entry-client"`
   */
  entryClientFile?: string;

  /**
   * The path to the MiuJS custom server filename without extensions, relative to `miu.config.js`.\
   * Default: `"app/entry-server"`
   */
  entryServerFile?: string;

  /**
   * Your custom directories to watch in devserver, relative to `miu.config.js`.\
   */
  customWatchDirectories?: string[];

  /**
   * Filenames or a glob patterns to match files in the `routes` directory.
   */
  ignoreRouteFiles?: string[];
}

export interface MiuConfig {
  rootDirectory: string;
  sourceDirectory: string;
  routesDirectory: string;
  layoutsDirectory: string;
  themeDirectory: string;
  sectionsDirectory: string;
  partialsDirectory: string;
  serverBuildPath: string;
  serverBuildDirectory: string;
  serverModuleFormat: ServerModuleFormat;
  serverBuildTarget?: ServerBuildTarget;
  serverBuildTargetEntryModule: string;
  serverEntryPoint?: string;
  clientBuildDirectory: string;
  clientPublicPath: string;
  entryClientFile: string;
  entryServerFile: string;
  routes: Record<string, ConfigRoute>;
  customWatchDirectories?: string[];
  templates: {
    layouts: Record<string, ConfigTemplate>;
    sections: Record<string, ConfigTemplate>;
    partials: Record<string, ConfigTemplate>;
  };
  relativePath: {
    routes: string;
    layouts: string;
    sections: string;
    partials: string;
    entryClient: string;
  };
}

export type ConfigTemplate = {
  file: string;
};

export interface ConfigRoute {
  id: string;
  path: string;
  file: string;
}
