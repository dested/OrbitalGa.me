import {WebSocketClient} from './webSocketClient';

export class WebSocketServerSocket {
  private onMessageCallback?: (message: {}) => void;

  constructor(private wsClient: WebSocketClient) {
    wsClient.onSend = (message: any) => {
      this.onMessageCallback?.(message);
    };
  }

  close() {
    this.wsClient.close();
  }

  binaryType: string = '';

  onmessage(callback: (message: {}) => void) {
    this.onMessageCallback = callback;
  }

  onclose(callback: () => void) {}

  send(message: string | ArrayBuffer) {
    this.wsClient.onmessage?.({data: message});
  }
}
