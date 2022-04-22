import { BrowserComponent } from "../types/components";

export class LiveFrame extends BrowserComponent {
  static $name = "live-frame";

  private src: string | null;
  private frameId: string | null;
  private delay: number;
  private observer: IntersectionObserver;
  private triggered = false;

  constructor() {
    super();

    this.src = this.getAttribute("data-src");
    this.frameId = this.getAttribute("data-id");

    const attrDelay = this.getAttribute("data-delay");
    this.delay = !isNaN(Number(attrDelay)) ? Number(attrDelay) : 0;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.triggered) {
          this.triggered = true;
          this.fetchHTML();
        }
      });
    });

    this.observer.observe(this);
  }

  private async fetchHTML() {
    if (this.src && this.frameId) {
      console.log(fetch);
      const html = await fetch(this.src, {
        headers: {
          "Content-Type": "text/html"
        }
      })
        .then((res) => res.text())
        .catch((err) => console.error(err));

      if (!html) return;

      const dom = new DOMParser().parseFromString(html, "text/html");
      const frame = dom.querySelector(`live-frame, #${this.frameId}`);
      if (frame) {
        window.setTimeout(() => {
          this.innerHTML = frame.innerHTML;
        }, this.delay);
      }
    }
  }
}
