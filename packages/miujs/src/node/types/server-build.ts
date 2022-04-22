import type { RiotComponentWrapper } from "riot";
import type { AssetsManifest } from "./compiler";
import type { ServerEntryModuleHandler } from "./server-entry";
import type { MiuConfig } from "./config";
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
    layouts: Record<string, RiotComponentWrapper>;
    sections: Record<string, RiotComponentWrapper>;
    partials: Record<string, RiotComponentWrapper>;
  };
}

export interface VirtualModule {
  id: string;
  filter: RegExp;
}

export type { AssetsManifest };
