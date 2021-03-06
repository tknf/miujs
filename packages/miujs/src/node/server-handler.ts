import type { RouteMatch } from "./types/route-matching";
import type { CreateRequestHandlerFunction, RequestContext } from "./types/server-handler";
import type { ServerMode } from "./types/server-mode";
import type { RouteManifest, ServerBuild } from "./types/server-build";
import type { ServerErrorState, ServerEntryModuleContext } from "./types/server-entry";
import type { RouteActionModuleKeys } from "./types/route-modules";

import { setupTemplate, render, renderRaw } from "./templates";
import { isValidRequestMethod } from "./request";
import { getContentTypeHeader, TextHtml } from "./response";
import { matchRoutes } from "./route-matching";
import { isServerMode } from "./server-mode";
import { RenderContent, RenderContext } from "./types/render";

export const createRequestHandler: CreateRequestHandlerFunction = (build, mode, serverContext = {}) => {
  const routes = createRoutes(build.routes);
  const servermode: ServerMode = isServerMode(mode) ? mode : "production";

  setupTemplate({ partials: build.templates.partials, sections: build.templates.sections });

  return async function requestHandler(request, entryContext = {}) {
    const match = matchRoutes(routes, request.url);
    const appContext = Object.assign(serverContext, entryContext, {
      theme: build.theme,
      markdownContents: build.markdownContents
    });

    const response = await handleRequest({ build, context: appContext, match, request, servermode });

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
  servermode
}: {
  build: ServerBuild;
  context: RequestContext;
  match: RouteMatch | null;
  request: Request;
  servermode: ServerMode;
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
    responseHeaders = {
      [getContentTypeHeader()]: TextHtml()
    };
    responseStatusCode = 404;
    markup = renderRaw(getLayout(build, "404"), `<pre><code>Not Found.</code></pre>`, renderContext);
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
            createContent: defineCreateContentFunction(build, renderContext)
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
          createContent: defineCreateContentFunction(build, renderContext)
        });
      }

      responseStatusCode = 404;
      responseHeaders = {
        [getContentTypeHeader()]: TextHtml()
      };
      markup = renderRaw(getLayout(build, "404"), `<pre><code>Not Found.</code></pre>`, renderContext);
    } catch (err) {
      // server error (500)
      responseStatusCode = 500;
      error = serializeError(err);
      renderContext.error = error;
      responseHeaders = {
        [getContentTypeHeader()]: TextHtml()
      };
      markup = renderRaw(
        getLayout(build, "500"),
        `<pre><code>${String(err.message + err.stack)}</code></pre>`,
        renderContext
      );
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

function getLayout(build: ServerBuild, layout = "default") {
  if (!build.templates.layouts[layout]) {
    throw new Error(`Layout "${layout}" is not found.`);
  }

  return build.templates.layouts[layout];
}

function defineCreateContentFunction(
  build: ServerBuild,
  context: RenderContext
): (renderContent: RenderContent) => string {
  return (renderContent: RenderContent) => {
    const layout = getLayout(build, renderContent.layout);

    context = {
      ...context,
      __raw_html: renderContent.__raw_html,
      metadata: renderContent.metadata,
      data: renderContent.data
    };

    return render(layout, renderContent.sections || [], context);
  };
}

function createRoutes(manifest: RouteManifest) {
  return Object.keys(manifest).map((id) => manifest[id]);
}
