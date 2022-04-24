import type { MiuBrowserOptions } from "./types/entry";
import type { BrowserComponent } from "./types/components";
import { domReady } from "./utils/dom-ready";

export class MiuBrowser {
  private stylesheets: HTMLLinkElement[] = [];
  private components: typeof BrowserComponent[] = [];

  constructor({ log = true }: MiuBrowserOptions = {}) {
    if (log) {
      console.log(`\nMiuJS ${process.env.MIUJS_VERSION} - ☆☆\n` + `\nDocument: https://www.miujs.com\n\n`);
    }
  }

  public use(component: typeof BrowserComponent) {
    this.components.push(component);
  }

  public css(stylesheetUrl: string) {
    const link = document.createElement("link");
    link.href = stylesheetUrl;
    link.rel = `stylesheet`;
    this.stylesheets.push(link);
  }

  public start() {
    domReady().then(() => {
      for (const component of this.components) {
        // @ts-ignore
        const name = component.$name;
        if (name && !window.customElements.get(name)) {
          window.customElements.define(name, component);
        }
      }

      for (const stylesheet of this.stylesheets) {
        document.head.appendChild(stylesheet);
      }
    });
  }
}
