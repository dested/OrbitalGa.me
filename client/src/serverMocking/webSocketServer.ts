import {WebSocketServerSocket} from './webSocketServerSocket';
import {WebSocketClient} from './webSocketClient';

export class WebSocketServer {
  static singleton: WebSocketServer;

  connectionCallback?: (wsClient: WebSocketClient) => void;

  constructor(options: any) {
    WebSocketServer.singleton = this;
  }

  on(event: 'connection', cb: (socket: WebSocketServerSocket) => void): this {
    this.connectionCallback = (wsClient: WebSocketClient) => {
      cb(new WebSocketServerSocket(wsClient));

      setTimeout(() => wsClient.onopen?.(), 10);
    };
    return this;
  }
}
