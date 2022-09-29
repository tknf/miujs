import type { AssetsManifest } from "./compiler";
import type { ServerEntryModuleHandler } from "./server-entry";
import type { MiuConfig, ConfigMarkdownContent } from "./config";
import type { RouteModule } from "./route-modules";

export interface ServerEntryModule {
  module: {
    default: ServerEntryModuleHandler;
  };
}

export interface RouteBuild {
  id: string;
  path: string;
  module: RouteModule;
}

export interface RouteManifest {
  [routeId: string]: RouteBuild;
}

export interface ServerBuild {
  entry: ServerEntryModule;
  routes: RouteManifest;
  assets: AssetsManifest;
  config: MiuConfig;
  theme: {
    config: Record<string, any>;
    locale: Record<string, any>;
  };
  templates: {
    routes: Record<string, string>;
    layouts: Record<string, string>;
    partials: Record<string, string>;
  };
  markdownContents?: ConfigMarkdownContent[];
}

export interface VirtualModule {
  id: string;
  filter: RegExp;
}

export type { AssetsManifest };
