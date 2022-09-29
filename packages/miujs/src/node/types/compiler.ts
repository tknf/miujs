import type * as esbuild from "esbuild";

export type BuildMode = "development" | "production" | "test";

export type BuildTarget = "node14";

export interface BuildOptions {
  mode?: BuildMode;
  target?: BuildTarget;
  sourcemap?: boolean;
  onWarning?(message: string, key: string): void;
  onBuildFailure?(failure: Error | esbuild.BuildFailure): void;
}

export interface WatchOptions extends BuildOptions {
  onRebuildStart?(): void;
  onRebuildFinish?(): void;
  onFileCreated?(file: string): void;
  onFileChanged?(file: string): void;
  onFileDeleted?(file: string): void;
  onInitialBuild?(): void;
}

export interface AssetsManifestFileOutput {
  file: string;
  src: string;
  isEntry?: true;
  isDynamicEntry?: true;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
  assets?: string[];
  version: string;
}

export interface AssetsManifest {
  version: string;
  entries: {
    [key: string]: {
      module: string;
      imports: string[];
    };
  };
  url?: string;
}

export type AssetsManifestPromiseRef = {
  current?: Promise<unknown>;
};
