import type { Query, Params } from "./route-matching";
import type { RequestContext } from "./server-handler";

export type RouteLoaderModuleKey = "get";
export type RouteActionModuleKeys = "post" | "put" | "patch" | "delete";
export type RouteModuleKeys = "default" | RouteLoaderModuleKey | RouteActionModuleKeys;

export type RouteModuleArgs = {
  request: Request;
  context: RequestContext;
  query?: Query;
  params?: Params;
  dev?: boolean;
  template: (name: string, scope?: Record<string, any>) => string;
};

export type RouteAction = (args: RouteModuleArgs) => Response | Promise<Response>;

export type RouteModule = Partial<Record<RouteLoaderModuleKey, RouteAction>> &
  Partial<Record<RouteActionModuleKeys, RouteAction>>;
