import type { ServerBuild } from "./server-build";
import type {} from "./route-modules";

export type RequestHandler = (request: Request, entryContext?: any) => Promise<Response>;

export type CreateRequestHandlerFunction = (build: ServerBuild, mode?: string, context?: any) => RequestHandler;
