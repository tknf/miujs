import { parse, serialize } from "cookie";
import type { Cookie, CreateCookieFunction } from "./types/cookies";
import type { SignFunction, UnsignFunction } from "./types/crypto";
import { encode, decode } from "./crypto";

export const createCookieFactory = ({
  sign,
  unsign
}: {
  sign: SignFunction;
  unsign: UnsignFunction;
}): CreateCookieFunction => {
  return (name, options = {}) => {
    const { secrets, ...opts } = {
      secrets: [],
      path: "/",
      ...options
    };

    return {
      get name() {
        return name;
      },

      get isSigned() {
        return secrets.length > 0;
      },

      get expires() {
        return typeof opts.maxAge !== "undefined" ? new Date(Date.now() + opts.maxAge * 1000) : opts.expires;
      },

      async parse(cookieHeader, parseOptions) {
        if (!cookieHeader) return null;

        const cookies = parse(cookieHeader, { ...opts, ...parseOptions });
        return name in cookies
          ? cookies[name] === ""
            ? ""
            : await decodeCookieValue(unsign, cookies[name], secrets)
          : null;
      },

      async serialize(value, serializeOptions) {
        return serialize(name, value === "" ? "" : await encodeCookieValue(sign, value, secrets), {
          ...opts,
          ...serializeOptions
        });
      }
    };
  };
};

async function encodeCookieValue(sign: SignFunction, value: any, secrets: string[]): Promise<string> {
  let encoded = encode(value);

  if (secrets.length > 0) {
    encoded = await sign(encoded, secrets[0]);
  }

  return encoded;
}

async function decodeCookieValue(unsign: UnsignFunction, value: string, secrets: string[]): Promise<any> {
  if (secrets.length > 0) {
    for (const secret of secrets) {
      const unsigned = await unsign(value, secret);
      if (unsigned !== false) {
        return decode(unsigned);
      }
    }

    return null;
  }

  return decode(value);
}

export function isCookie(value: any): value is Cookie {
  return (
    value != null &&
    typeof value.name === "string" &&
    typeof value.isSigned === "boolean" &&
    typeof value.parse === "function" &&
    typeof value.serialize === "function"
  );
}
