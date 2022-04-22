/**
 * @jest-environment jsdom
 */
import "intersection-observer"; // Intersection observer polyfill
import { LiveFrame } from "../components/live-frame";

describe("browser:live-frame", () => {
  window.customElements.define("live-frame", LiveFrame);

  test("live frame loaded", () => {
    document.body.innerHTML = `<h1>LiveReload test</h1> <live-frame data-src="/products" data-id="content"></live-frame>`;

    // @ts-ignore
    expect(window.customElements.get("live-frame").$name).toMatch("live-frame");
  });
});
