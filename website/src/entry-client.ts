import { MiuBrowser, LiveReload, LiveFrame } from "miujs/browser";
import Prism from "prismjs";
import css from "prism-themes/themes/prism-solarized-dark-atom.css";

export function main() {
  const Browser = new MiuBrowser();

  Browser.use(LiveReload);
  Browser.use(LiveFrame);
  Browser.css(css);

  Browser.start();
  Prism.highlightAll();
}

void main();
