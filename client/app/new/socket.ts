import {ServerMessage} from './base/types';
import {Utils} from './utils/utils';

export interface SocketClient {
  lastLatency: number;
  id: string;
  onMessage: (message: ServerMessage) => void;
  sendToServer: (message: ServerMessage) => void;
}

export class Socket {
  static ClientLatency = 100;
  static ServerLatency = 100;

  static sockets: SocketClient[] = [];
  private static onServerMessage: (clientId: string, message: ServerMessage) => void;

  static onClientJoin: (client: SocketClient) => void;

  static clientJoin(onMessage: (message: ServerMessage) => void) {
    const client = {
      id: Utils.generateId(),
      lastLatency: 0,
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

  private static lastLatency: number;

  static sendToServer(clientId: string, message: ServerMessage) {
    const msg = JSON.parse(JSON.stringify(message));

    if (this.lastLatency > +new Date()) {
      this.lastLatency = this.lastLatency + Math.random() * this.ServerLatency;
    } else {
      this.lastLatency = +new Date() + Math.random() * this.ServerLatency;
    }

    setTimeout(() => {
      // console.log('send to server', JSON.stringify(message));
      this.onServerMessage(clientId, msg);
    }, this.lastLatency - +new Date());
  }

  static sendToClient(clientId: string, message: ServerMessage) {
    const client = this.sockets.find(a => a.id === clientId);
    const msg = JSON.parse(JSON.stringify(message));
    if (client) {
      if (client.lastLatency > +new Date()) {
        client.lastLatency = client.lastLatency + Math.random() * this.ClientLatency;
      } else {
        client.lastLatency = +new Date() + Math.random() * this.ClientLatency;
      }
      setTimeout(() => {
        client.onMessage(msg);
      }, client.lastLatency - +new Date());
    }
  }
}
