import type { ParsedUrlQuery } from "querystring";
import type { RouteBuild } from "./server-build";

export type Query = ParsedUrlQuery;

export type Params = {
  [param: string]: any;
};

export interface RouteMatchResult {
  path: string;
  matched: boolean;
  query?: Query;
  params?: Params;
}

export interface RouteMatch extends RouteMatchResult {
  route: RouteBuild;
}
