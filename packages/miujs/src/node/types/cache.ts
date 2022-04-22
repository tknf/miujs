export interface NoStoreStrategy {
  mode: string;
}

export type CachingStrategy = AllCacheOptions;

export interface AllCacheOptions {
  mode?: string;
  maxAge?: number;
  staleWhileRevalidate?: number;
  sMaxAge?: number;
  staleIfError?: number;
}
