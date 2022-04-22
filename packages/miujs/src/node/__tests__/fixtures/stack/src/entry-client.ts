import { MiuBrowser } from "miujs/browser";

function main() {
  const miu = new MiuBrowser({
    resolveScope: true
  });

  miu.start();
}

void main();
