import type { CreateCookieFunction, Cookie } from "./types/cookies";
import type {
  CreateSessionStorageFunction,
  CreateSessionFunction,
  CreateCookieSessionStorageFunction,
  Session
} from "./types/sessions";
import { isCookie } from "./cookies";
import * as logger from "./logger";

export const createSession: CreateSessionFunction = (initialData = {}, id = "") => {
  const store = new Map<string, any>(Object.entries(initialData));

  return {
    get id() {
      return id;
    },

    get data() {
      return Object.fromEntries(store);
    },

    has(name) {
      return store.has(name) || store.has(flash(name));
    },

    get(name) {
      if (store.has(name)) return store.get(name);

      const flashName = flash(name);
      if (store.has(flashName)) {
        const value = store.get(flashName);
        store.delete(flashName);
        return value;
      }

      return undefined;
    },

    set(name, value) {
      store.set(name, value);
    },

    flash(name, value) {
      store.set(flash(name), value);
    },

    unset(name) {
      store.delete(name);
    }
  };
};

export const createSessionStorageFactory = (createCookie: CreateCookieFunction): CreateSessionStorageFunction => {
  return ({ cookie: _cookie, createData, readData, updateData, deleteData }) => {
    const cookie = isCookie(_cookie) ? _cookie : createCookie(_cookie?.name || "__Session", _cookie);
    warnAboutSigningSessionCookie(cookie);

    return {
      async getSession(cookieHeader, options) {
        const id = cookieHeader && (await cookie.parse(cookieHeader, options));
        const data = id && (await readData(id));
        return createSession(data || {}, id || "");
      },

      async commitSession(session, options) {
        const { data } = session;
        let { id } = session;

        if (id) {
          await updateData(id, data, cookie.expires);
        } else {
          id = await createData(data, cookie.expires);
        }

        return cookie.serialize(id, options);
      },

      async destroySession(session, options) {
        await deleteData(session.id);
        return cookie.serialize("", {
          ...options,
          expires: new Date(0)
        });
      }
    };
  };
};

export const createCookieSessionStorageFactory = (
  createCookie: CreateCookieFunction
): CreateCookieSessionStorageFunction => {
  return ({ cookie: _cookie } = {}) => {
    const cookie = isCookie(_cookie) ? _cookie : createCookie(_cookie?.name || "__Session", _cookie);
    warnAboutSigningSessionCookie(cookie);

    return {
      async getSession(cookieHeader, options) {
        return createSession((cookieHeader && (await cookie.parse(cookieHeader, options))) || {});
      },

      async commitSession(session, options) {
        const serializedCookie = await cookie.serialize(session.data, options);
        if (serializedCookie.length > 4096) {
          throw new Error(`Cookie length will exceed browser maximum. Length: ${serializedCookie.length}`);
        }
        return serializedCookie;
      },

      async destroySession(_session, options) {
        return cookie.serialize("", {
          ...options,
          expires: new Date(0)
        });
      }
    };
  };
};

function flash(name: string): string {
  return `__Flash_${name}__`;
}

export function isSession(value: any): value is Session {
  return (
    value != null &&
    typeof value.id === "string" &&
    typeof value.data !== "undefined" &&
    typeof value.has === "function" &&
    typeof value.get === "function" &&
    typeof value.set === "function" &&
    typeof value.flash === "function" &&
    typeof value.unset === "function"
  );
}

function warnAboutSigningSessionCookie(cookie: Cookie) {
  logger.warnOnce(
    cookie.isSigned,
    `The "${cookie.name}" cookie is not signed, but session cookies should be ` +
      `signed to prevent tampering on the client before they are sent back to the ` +
      `server. See https://remix.run/api/remix#signing-cookies ` +
      `for more information.`
  );
}
