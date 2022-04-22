/**
 * @jest-environment jsdom
 */

import { LiveReload } from "../components/live-reload";

describe("browser:live-reload", () => {
  process.env.NODE_ENV = "development";
  process.env.MIUJS_DEV_SERVER_WS_PORT = "8002";
  window.customElements.define("live-reload", LiveReload);

  test("live reload loaded", () => {
    document.body.innerHTML = `<h1>LiveReload test</h1> <live-reload></live-reload>`;
    const element = document.querySelector("live-reload") as LiveReload;

    expect(element.port).toBe(8002);
    expect(element.liveReloadMounted).toBe(true);

    // @ts-ignore
    expect(window.customElements.get("live-reload").$name).toMatch("live-reload");
  });
});
