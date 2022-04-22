import { BrowserComponent } from "../types/components";

export class LiveProgressbar extends BrowserComponent {
  static $name = "live-progressbar";

  private duration = 300;
  private height = 3;
  private color = `#000000`;
  private hiding = false;
  private interval?: number;
  private value = 0;
  private visible = false;
  private shadow?: ShadowRoot;

  public readonly stylesheet: HTMLStyleElement;
  public readonly element: HTMLElement;

  constructor() {
    super();

    this.stylesheet = this.initStylesheet();
    this.element = this.initElement();
    this.setValue(0);
    this.init();
  }

  public show() {
    if (!this.visible) {
      this.visible = true;
      this.install();
      this.start();
    }
  }

  public hide() {
    if (this.visible && !this.hiding) {
      this.hiding = true;
      console.log(this.duration);
      this.fade(() => {
        this.uninstall();
        this.stop();
        this.visible = false;
        this.hiding = false;
      });
    }
  }

  public setValue(value: number) {
    this.value = value;
    this.refresh();
  }

  private install() {
    if (this.shadow) {
      this.element.style.width = "0";
      this.element.style.opacity = "1";
      this.shadow.appendChild(this.element);
      this.refresh();
    }
  }

  private fade(callback: () => void) {
    this.element.style.opacity = "0";
    window.setTimeout(callback, this.duration * 1.5);
  }

  private uninstall() {
    if (this.shadow) {
      this.shadow.removeChild(this.element);
    }
  }

  private start() {
    if (!this.interval) {
      this.interval = window.setInterval(() => {
        this.setValue(this.value + Math.random() / 100);
      }, this.duration);
    }
  }

  private stop() {
    window.clearInterval(this.interval);
    delete this.interval;
  }

  private refresh() {
    window.requestAnimationFrame(() => {
      this.element.style.width = `${10 + this.value * 90}%`;
    });
  }

  private init() {
    const durationAttr = this.getAttribute("data-duration");
    if (durationAttr && !isNaN(Number(durationAttr))) {
      this.duration = Number(durationAttr);
    }
    const heightAttr = this.getAttribute("data-height");
    if (heightAttr && !isNaN(Number(heightAttr))) {
      this.height = Number(heightAttr);
    }
    this.color = this.getAttribute("data-color") || `#000000`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(this.stylesheet);
    this.shadow = shadow;
  }

  private initStylesheet() {
    const stylesheet = document.createElement("style");
    stylesheet.setAttribute("type", "text/css");
    stylesheet.textContent = this.CSS;
    return stylesheet;
  }

  private initElement() {
    const element = document.createElement("div");
    element.classList.add("progress");
    return element;
  }

  private get CSS() {
    return `
    .progress {
      position: fixed;
      display: block;
      top: 0;
      left: 0;
      height: ${this.height}px;
      background-color: ${this.color};
      z-index: 2147483647;
      opacity: 0;
      pointer-events: none;
      transition: width ${this.duration}ms ease, opacity ${this.duration / 2}ms ${this.duration / 2}ms ease;
      transform: translate3d(0,0,0);
    }
    `;
  }
}
