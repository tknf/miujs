import { createCookieFactory } from "../cookies";
import { createCookieSessionStorageFactory, createSessionStorageFactory } from "../sessions";
import { sign, unsign } from "./crypto";

export const createCookie = createCookieFactory({ sign, unsign });
export const createCookieSessionStorage = createCookieSessionStorageFactory(createCookie);
export const createSessionStorage = createSessionStorageFactory(createCookie);
