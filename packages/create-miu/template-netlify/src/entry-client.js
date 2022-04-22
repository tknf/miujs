import { MiuBrowser, LiveReload, LiveFrame } from "miujs/browser";

export function main() {
  const Browser = new MiuBrowser();

  Browser.use(LiveReload);
  Browser.use(LiveFrame);

  Browser.start();
}

void main();
