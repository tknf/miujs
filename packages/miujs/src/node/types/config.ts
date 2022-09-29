/**
 * TODO:
 * Add target
 * - "cloud-flare"
 */
export type ServerBuildTarget = "node" | "vercel" | "netlify";

export type ServerModuleFormat = "esm" | "cjs";

// FIX
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

  templates?: {
    /**
     * The path to the route files directory, relative to `sourceDirectory`.\
     * Default: `"templates/routes"`
     */
    routesDirectory?: string;

    /**
     * The path to the section files directory, relative to `sourceDirectory`.\
     * Default: `"templates/layouts"`
     */
    layoutsDirectory?: string;

    /**
     * The path to the partial files directory, relative to `sourceDirectory`.\
     * Default: `"templates/partials"`
     */
    partialsDirectory?: string;
  };

  /**
   * The path to the theme config files directory, relative to `sourceDirectory`.\
   * Default: `"theme"`
   */
  themeDirectory?: string;

  /**
   * Configuration for markdown content build.
   */
  markdown?: Partial<MarkdownConfig>;

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
   * The Set of key and path to the client javascript entry filenames relative to `miu.config.js`.\
   * Default: {}
   */
  clientEntries?: Record<string, string>;

  /**
   * The path to the MiuJS server entrypoint filename relative to `miu.config.js`.\
   * Default: `"src/entry-server"`
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
  templateDirectories: {
    routes: string;
    layouts: string;
    partials: string;
  };
  themeDirectory: string;

  markdown: MarkdownConfig & {
    contents: ConfigMarkdownContent[];
  };

  serverBuildPath: string;
  serverBuildDirectory: string;
  serverModuleFormat: ServerModuleFormat;
  serverBuildTarget?: ServerBuildTarget;
  serverBuildTargetEntryModule: string;
  serverEntryPoint?: string;

  clientBuildDirectory: string;
  clientPublicPath: string;
  clientEntries: Record<string, string>;

  entryServerFile: string;

  routes: Record<string, ConfigRoute>;
  customWatchDirectories?: string[];
  templates: {
    routes: Record<string, ConfigTemplate>;
    layouts: Record<string, ConfigTemplate>;
    partials: Record<string, ConfigTemplate>;
  };

  relativePath: {
    routes: string;
    templates: {
      routes: string;
      layouts: string;
      partials: string;
    };
    clientEntries: Record<string, string>;
  };
}

export type MarkdownConfig = {
  enable: boolean;

  /**
   * The path to the markdown contents directory, relative to `miu.config.js`.\
   * Default: "src/contents"
   */
  contentsDirectory: string;
};

export type ConfigMarkdownContent = {
  key: string;
  data: any;
  content: string;
};

export type ConfigTemplate = {
  file: string;
};

export interface ConfigRoute {
  id: string;
  path: string;
  file: string;
}
