
if (typeof globalThis.MessageChannel === 'undefined') {
    class PolyMessageChannel {
      port1: any;
      port2: any;
      constructor() {
        this.port1 = { onmessage: null, postMessage: (msg: any) => this.port2.onmessage?.({ data: msg }) };
        this.port2 = { onmessage: null, postMessage: (msg: any) => this.port1.onmessage?.({ data: msg }) };
      }
    }
    globalThis.MessageChannel = PolyMessageChannel as any;
  }
  