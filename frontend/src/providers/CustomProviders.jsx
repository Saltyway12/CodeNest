// CustomProvider.jsx
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

export class CustomProvider {
  constructor(url, roomName, ydoc) {
    this.url = url;
    this.roomName = roomName;
    this.ydoc = ydoc;
    this.ws = null;
    this.awareness = new Awareness(ydoc);

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(`${this.url}?room=${this.roomName}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const update = new Uint8Array(event.data);
        Y.applyUpdate(this.ydoc, update);
      }
    };

    this.ws.onopen = () => {
      const update = Y.encodeStateAsUpdate(this.ydoc);
      this.ws.send(update);
    };

    this.awareness.on("update", () => {
      const state = this.awareness.getLocalState();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "awareness", state }));
      }
    });
  }

  sendUpdate(update) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(update);
    }
  }

  destroy() {
    this.awareness.destroy();
    if (this.ws) this.ws.close();
  }
}
