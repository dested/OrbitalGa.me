import {ServerMessage} from './base/types';
import {Utils} from './utils/utils';

export interface SocketClient {
  id: string;
  latency: number;
  onMessage: (message: ServerMessage) => void;
  sendToServer: (message: ServerMessage) => void;
}
declare let window: any;
window.incomingChatter = 0;
window.outgoingChatter = 0;
export class Socket {
  static sockets: SocketClient[] = [];
  private static onServerMessage: (clientId: string, message: ServerMessage) => void;

  static onClientJoin: (client: SocketClient) => void;

  static clientJoin(onMessage: (message: ServerMessage) => void) {
    const client = {
      id: Utils.generateId(),
      latency: Math.random() * 50 + 50,
      onMessage,
      sendToServer: (message: ServerMessage) => {
        this.sendToServer(client.id, client.latency, message);
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

  static sendToServer(clientId: string, latency: number, message: ServerMessage) {
    const msg = JSON.parse(JSON.stringify(message));

    setTimeout(() => {
      window.outgoingChatter += JSON.stringify(message).length;
      console.log(JSON.stringify(message))
      this.onServerMessage(clientId, msg);
    }, latency);
  }

  static sendToClient(clientId: string, message: ServerMessage) {
    const client = this.sockets.find(a => a.id === clientId);
    const msg = JSON.parse(JSON.stringify(message));
    if (client) {
      setTimeout(() => {
        window.incomingChatter += JSON.stringify(message).length;
        client.onMessage(msg);
      }, client.latency);
    }
  }
}
