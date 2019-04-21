import {ServerMessage} from './base/types';
import {Utils} from './utils/utils';

export interface SocketClient {
  id: string;
  latency: number;
  onMessage: (message: ServerMessage) => void;
  sendToServer: (message: ServerMessage) => void;
}

export class Socket {
  static ServerLatency = 200;

  static sockets: SocketClient[] = [];
  private static onServerMessage: (clientId: string, message: ServerMessage) => void;

  static onClientJoin: (client: SocketClient) => void;

  static clientJoin(onMessage: (message: ServerMessage) => void) {
    const client = {
      id: Utils.generateId(),
      latency: Math.random() * 100 + 100,
      onMessage,
      sendToServer: (message: ServerMessage) => {
        this.sendToServer(client.id, message);
      },
    };
    this.sockets.push(client);
    this.onClientJoin(client);
    return client;
  }

  static createServer(
    onMessage: (clientId: string, message: ServerMessage) => void,
    onClientJoin: (client: SocketClient) => void
  ) {
    this.onServerMessage = onMessage;
    this.onClientJoin = onClientJoin;
  }

  static sendToServer(clientId: string, message: ServerMessage) {
    const msg = JSON.parse(JSON.stringify(message));

    setTimeout(() => {
      // console.log('send to server', JSON.stringify(message));
      this.onServerMessage(clientId, msg);
    }, this.ServerLatency);
  }

  static sendToClient(clientId: string, message: ServerMessage) {
    const client = this.sockets.find(a => a.id === clientId);
    const msg = JSON.parse(JSON.stringify(message));
    if (client) {
      setTimeout(() => {
        client.onMessage(msg);
      }, client.latency);
    }
  }
}
