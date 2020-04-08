import {IServerSocket} from '../../../server/src/serverSocket';
import {WebSocketServer} from './webSocketServer';
import {WebSocketServerSocket} from './webSocketServerSocket';
import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {uuid} from '@common/utils/uuid';
import {GameConstants} from '@common/game/gameConstants';
import {ClientToServerMessageParser} from '@common/parsers/clientToServerMessageParser';
import {ServerToClientMessageParser} from '@common/parsers/serverToClientMessageParser';

export class LocalServerSocket implements IServerSocket {
  connections: {connectionId: string; socket: WebSocketServerSocket}[] = [];
  totalBytesReceived = 0;

  totalBytesSent = 0;
  wss?: WebSocketServer;

  sendMessage(connectionId: string, messages: ServerToClientMessage[]) {
    const client = this.connections.find((a) => a.connectionId === connectionId);
    if (!client) {
      return;
    }
    if (GameConstants.binaryTransport) {
      const body = ServerToClientMessageParser.fromServerToClientMessages(messages);
      this.totalBytesSent += body.byteLength;
      client.socket.send(body);
    } else {
      const body = JSON.stringify(messages);
      this.totalBytesSent += body.length * 2 + 1;
      client.socket.send(body);
    }
  }

  start(
    onJoin: (connectionId: string) => void,
    onLeave: (connectionId: string) => void,
    onMessage: (connectionId: string, message: ClientToServerMessage) => void
  ) {
    const port = parseInt('8081');
    this.wss = new WebSocketServer({port, perMessageDeflate: false});

    this.wss.on('connection', (ws) => {
      ws.binaryType = 'arraybuffer';
      const me = {socket: ws, connectionId: uuid()};
      // console.log('new connection', me.connectionId);
      this.connections.push(me);

      ws.onmessage((message) => {
        if (GameConstants.binaryTransport) {
          this.totalBytesReceived += (message as ArrayBuffer).byteLength;
          const messageData = ClientToServerMessageParser.toClientToServerMessage(message as ArrayBuffer);
          if (messageData === null) {
            ws.close();
            return;
          }

          onMessage(me.connectionId, messageData);
        } else {
          onMessage(me.connectionId, JSON.parse(message as string));
        }
      });

      ws.onclose = () => {
        const ind = this.connections.findIndex((a) => a.connectionId === me.connectionId);
        if (ind === -1) {
          return;
        }
        this.connections.splice(ind, 1);
        onLeave(me.connectionId);
      };
      onJoin(me.connectionId);
    });
  }
}
