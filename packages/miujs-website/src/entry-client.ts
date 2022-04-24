import { MiuBrowser, LiveReload, LiveFrame } from "miujs/browser";
import Prism from "prismjs";
import css from "prism-themes/themes/prism-lucario.css";

export function main() {
  const Browser = new MiuBrowser();

  Browser.use(LiveReload);
  Browser.use(LiveFrame);

  Browser.start();

  const link = document.createElement("link");
  link.href = css;
  link.rel = "stylesheet";
  document.head.appendChild(link);

  Prism.highlightAll();
}

void main();
