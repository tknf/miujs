import type { CookieParseOptions, CookieSerializeOptions } from "cookie";
import type { Cookie, CookieOptions } from "./cookies";

export interface SessionData {
  [name: string]: any;
}

export interface Session {
  readonly id: string;
  readonly data: SessionData;
  has(name: string): boolean;
  get(name: string): any;
  set(name: string, value: any): void;
  flash(name: string, value: any): void;
  unset(name: string): void;
}

export type CreateSessionFunction = (initialData?: SessionData, id?: string) => Session;

export interface SessionStorage {
  getSession(cookieHeader?: string | null, options?: CookieParseOptions): Promise<Session>;
  commitSession(session: Session, options?: CookieSerializeOptions): Promise<string>;
  destroySession(session: Session, options?: CookieSerializeOptions): Promise<string>;
}

export interface SessionIdStorageStrategy {
  cookie?: Cookie | (CookieOptions & { name?: string });
  createData: (data: SessionData, expires?: Date) => Promise<string>;
  readData: (id: string) => Promise<SessionData | null>;
  updateData: (id: string, data: SessionData, expires?: Date) => Promise<void>;
  deleteData: (id: string) => Promise<void>;
}

export type CreateSessionStorageFunction = (strategy: SessionIdStorageStrategy) => SessionStorage;

interface CookieSessionStorageOptions {
  cookie?: SessionIdStorageStrategy["cookie"];
}

export type CreateCookieSessionStorageFunction = (options?: CookieSessionStorageOptions) => SessionStorage;
