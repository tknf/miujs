import { BrowserComponent } from "../types/components";

export class LiveReload extends BrowserComponent {
  static $name = "live-reload";

  public port: number;
  public liveReloadMounted = false;

  constructor() {
    super();
    this.port = Number(process.env.MIUJS_DEV_SERVER_WS_PORT) ?? 8002;

    if (process.env.NODE_ENV === "development" && !this.liveReloadMounted) {
      this.setupLiveReload(this.port);
      this.liveReloadMounted = true;
    }
  }

  private setupLiveReload(port: number) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const socketPath = `${protocol}//${host}:${port}/socket`;

    const ws = new window.WebSocket(socketPath);
    ws.onmessage = (message) => {
      const event = JSON.parse(message.data);
      if (event.type === "LOG") {
        console.log(event.message);
      }
      if (event.type === "RELOAD") {
        console.log(`✨ Reloading window ...`);
        window.location.reload();
      }
    };
    ws.onerror = (error) => {
      console.log(`Miu dev server websocket error:`);
      console.error(error);
    };
  }
}
