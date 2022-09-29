import type { Picx } from "picx";
import type { RouteMatch } from "./types/route-matching";
import type { CreateRequestHandlerFunction, RequestContext } from "./types/server-handler";
import type { ServerMode } from "./types/server-mode";
import type { RouteManifest, ServerBuild } from "./types/server-build";
import type { ServerErrorState, ServerEntryModuleContext } from "./types/server-entry";
import type { RouteActionModuleKeys } from "./types/route-modules";
import type { RenderContext } from "./types/render";

import { render, renderRaw, setupPicx } from "./templates";
import { isValidRequestMethod } from "./request";
import { getContentTypeHeader, TextHtml } from "./response";
import { matchRoutes } from "./route-matching";
import { isServerMode } from "./server-mode";

export const createRequestHandler: CreateRequestHandlerFunction = (build, mode, serverContext = {}) => {
  const routes = createRoutes(build.routes);
  const servermode: ServerMode = isServerMode(mode) ? mode : "production";

  const engine = setupPicx({
    routes: build.templates.routes,
    layouts: build.templates.layouts,
    partials: build.templates.partials,
    assets: build.assets
  });

  return async function requestHandler(request, entryContext = {}) {
    const match = matchRoutes(routes, request.url);
    const appContext = Object.assign(serverContext, entryContext, {
      theme: build.theme,
      markdownContents: build.markdownContents
    });

    const response = await handleRequest({ engine, build, context: appContext, match, request, servermode });

    if (request.method.toLowerCase() === "head") {
      return new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
      });
    }

    return response;
  };
};

async function handleRequest({
  build,
  context,
  match,
  request,
  servermode,
  engine
}: {
  build: ServerBuild;
  context: RequestContext;
  match: RouteMatch | null;
  request: Request;
  servermode: ServerMode;
  engine: Picx;
}): Promise<Response> {
  const handler = build.entry.module.default;

  const renderContext: RenderContext = {
    theme: context.theme,
    assets: build.assets,
    mode: servermode
  };

  const dev = servermode === "development";
  let responseStatusCode: number;
  let responseHeaders: HeadersInit = {};
  let error: ServerErrorState | undefined;
  let markup: string;

  if (!isValidRequestMethod(request)) {
    // invalid request (405)
    markup = "Method not Allowed";
    return new Response(markup, {
      status: 405,
      statusText: `Method not allowed`
    });
  } else if (!match) {
    // not found (404)
    responseStatusCode = 404;
    error = {
      message: `Not Found`
    };
    renderContext.error = error;
    renderContext.__raw_html = `<pre><code>Not Found.</code></pre>`;
    responseHeaders = {
      [getContentTypeHeader()]: TextHtml()
    };
    responseStatusCode = 404;
    markup = renderRaw(engine, getRouteLayout(build, "404"), renderContext);
  } else {
    try {
      const method = request.method.toLocaleLowerCase();
      if (match.route?.module && method !== "get") {
        // action ["POST", "PUT", "PATCH", "DELETE"]
        const action = match.route.module[method as RouteActionModuleKeys];
        if (action) {
          return await action({
            dev,
            request,
            query: match.query,
            params: match.params,
            context,
            template: defineCreateContentFunction(engine, renderContext)
          });
        }
      } else if (match.route?.module.get && method === "get") {
        // load ["GET"]
        return await match.route.module.get({
          dev,
          request,
          query: match.query,
          params: match.params,
          context,
          template: defineCreateContentFunction(engine, renderContext)
        });
      }

      responseStatusCode = 404;
      responseHeaders = {
        [getContentTypeHeader()]: TextHtml()
      };
      renderContext.__raw_html = `<pre><code>Not Found.</code></pre>`;
      markup = renderRaw(engine, getRouteLayout(build, "404"), renderContext);
    } catch (err) {
      // server error (500)
      responseStatusCode = 500;
      error = serializeError(err);
      renderContext.error = error;
      renderContext.__raw_html = `<pre><code>${String(err.message + err.stack)}</code></pre>`;
      responseHeaders = {
        [getContentTypeHeader()]: TextHtml()
      };
      markup = renderRaw(engine, getRouteLayout(build, "500"), renderContext);
    }
  }

  const entryContext: ServerEntryModuleContext = {
    assets: build.assets,
    routes: build.routes,
    error
  };

  return await handler(request, responseStatusCode, new Headers(responseHeaders), markup, entryContext);
}

function serializeError(error: Error): ServerErrorState {
  return {
    message: error.message,
    stack: error.stack
  };
}

function getRouteLayout(build: ServerBuild, route: string) {
  return build.templates.routes[route];
}

function defineCreateContentFunction(
  engine: Picx,
  context: RenderContext
): (name: string, scope?: Record<string, any>) => string {
  return (name: string, scope?: Record<string, any>) => {
    if (!name.startsWith("routes/")) {
      name = `routes/${name}`;
    }

    context = {
      ...context,
      ...scope
    };

    return render(engine, name, context);
  };
}

function createRoutes(manifest: RouteManifest) {
  return Object.keys(manifest).map((id) => manifest[id]);
}
