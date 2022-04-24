import type { AssetsManifest } from "./server-build";
import type { ServerMode } from "./server-mode";
import type { ServerErrorState } from "./server-entry";

export type RenderSection = {
  name: string;
  settings?: Record<string, any>;
};

export interface RenderContent {
  layout?: string;
  sections?: RenderSection[];
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  __raw_html?: string;
}

export interface RenderContext {
  theme: any;
  assets: AssetsManifest;
  mode: ServerMode;
  metadata?: Record<string, any>;
  error?: ServerErrorState;
  data?: Record<string, any>;
  __raw_html?: string;
}
