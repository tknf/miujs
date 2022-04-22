import type { CookieParseOptions, CookieSerializeOptions } from "cookie";

export type { CookieParseOptions, CookieSerializeOptions };

export interface CookieSignatureOptions {
  secrets?: string[];
}

export interface CookieOptions extends CookieParseOptions, CookieSerializeOptions, CookieSignatureOptions {}

export interface Cookie {
  readonly name: string;
  readonly isSigned: boolean;
  readonly expires?: Date;

  parse(cookieHeader: string | null, options?: CookieParseOptions): Promise<any>;

  serialize(value: any, options?: CookieSerializeOptions): Promise<string>;
}

export type CreateCookieFunction = (name: string, cookieOptions?: CookieOptions) => Cookie;
