import { RenderContent } from "./render";
import type { Query, Params } from "./route-matching";

export type RouteLoaderModuleKey = "get";
export type RouteActionModuleKeys = "post" | "put" | "patch" | "delete";
export type RouteModuleKeys = "default" | RouteLoaderModuleKey | RouteActionModuleKeys;

export type RouteModuleArgs = {
  request: Request;
  query?: Query;
  params?: Params;
  context?: any;
  dev?: boolean;
  createContent: (renderContent: RenderContent) => string;
};

export type RouteAction = (args: RouteModuleArgs) => Response | Promise<Response>;

export type RouteModule = Partial<Record<RouteLoaderModuleKey, RouteAction>> &
  Partial<Record<RouteActionModuleKeys, RouteAction>>;
