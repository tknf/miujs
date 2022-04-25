import type { Key } from "path-to-regexp";
import { pathToRegexp, regexpToFunction } from "path-to-regexp";
import * as logger from "./logger";
import type { RouteBuild } from "./types/server-build";
import type { RouteMatch, Params } from "./types/route-matching";

function pathMatch(path: string) {
  const keys: Key[] = [];
  const matcherRegex = pathToRegexp(path, keys, { sensitive: false, delimiter: `/` });

  const matcher = regexpToFunction(matcherRegex, keys);

  return (pathname: string | null | undefined, params?: any) => {
    const res = pathname == null ? false : matcher(pathname);
    if (!res) {
      return false;
    }

    return {
      ...params,
      ...res.params
    };
  };
}

export function matchRoute(route: RouteBuild, requestUrl: string): RouteMatch {
  const url = new URL(requestUrl);
  const path = route.path;

  try {
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const matcher = pathMatch(path);
    const result = matcher(url.pathname) as Params | false;

    return {
      route,
      path,
      matched: result !== false,
      query,
      params: result ? result : undefined
    };
  } catch (err) {
    logger.error(err?.message ?? String(err));

    return {
      route,
      path,
      matched: false
    };
  }
}

export function matchRoutes(routes: RouteBuild[], url: string): RouteMatch | null {
  return routes.map((route) => matchRoute(route, url)).find((res) => res.matched) ?? null;
}
