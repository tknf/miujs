import type { AssetsManifest, RouteManifest } from "./server-build";

export interface ServerErrorState {
  message: string;
  stack?: string;
}

export interface ServerEntryModuleContext {
  assets: AssetsManifest;
  routes: RouteManifest;
  error?: ServerErrorState;
}

export interface ServerEntryModuleHandler {
  (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    markup: string,
    context: ServerEntryModuleContext
  ): Promise<Response> | Response;
}
