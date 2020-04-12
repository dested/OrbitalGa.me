import {WebSocketClient} from './webSocketClient';
import {ISocket} from '../../../server/src/serverSocket';

export class WebSocketServerSocket implements ISocket {
  binaryType: string = '';
  private onMessageCallback?: (message: {}) => void;

  constructor(private wsClient: WebSocketClient) {
    wsClient.onSend = (message: any) => {
      this.onMessageCallback?.(message);
    };
  }

  close() {
    this.wsClient.close();
  }

  onclose(callback: () => void) {}

  onmessage(callback: (message: {}) => void) {
    this.onMessageCallback = callback;
  }

  send(message: string | ArrayBuffer) {
    this.wsClient.onmessage?.({data: message});
  }
}
