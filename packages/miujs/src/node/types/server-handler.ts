import type { ServerBuild } from "./server-build";
import type { ConfigMarkdownContent } from "./config";

export type RequestHandler = (request: Request, entryContext?: any) => Promise<Response>;

export type RequestContext = {
  theme?: {
    config?: Record<string, any>;
    locale?: Record<string, any>;
  };
  markdownContents: ConfigMarkdownContent[];
};

export type CreateRequestHandlerFunction = (build: ServerBuild, mode?: string, context?: any) => RequestHandler;
