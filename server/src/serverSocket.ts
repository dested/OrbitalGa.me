///<reference path="./types/ws.d.ts"/>
import * as WebServer from 'ws';
import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {GameConstants} from '@common/game/gameConstants';
import {uuid} from '@common/utils/uuid';
import {ClientToServerMessageParser} from '@common/parsers/clientToServerMessageParser';
import {ServerToClientMessageParser} from '@common/parsers/serverToClientMessageParser';
import {createServer} from 'http';

export class ServerSocket implements IServerSocket {
  wss?: WebServer.Server;
  connections: {connectionId: string; socket: WebServer.WebSocket}[] = [];

  start(
    onJoin: (connectionId: string) => void,
    onLeave: (connectionId: string) => void,
    onMessage: (connectionId: string, message: ClientToServerMessage) => void
  ) {
    const port = parseInt(process.env.PORT || '8081');
    console.log('port', port);
    const server = createServer((req, res) => {
      if (req.method === 'GET') {
        res.writeHead(200);
        res.end();
      }
    });
    this.wss = new WebServer.Server({server, perMessageDeflate: false});
    this.wss.on('error', (a: any, b: any) => {
      console.error('error', a, b);
    });

    this.wss.on('connection', (ws) => {
      ws.binaryType = 'arraybuffer';
      const me = {socket: ws, connectionId: uuid()};
      console.count('new connection');
      this.connections.push(me);

      ws.on('message', (message) => {
        if (GameConstants.binaryTransport) {
          this.totalBytesReceived += (message as ArrayBuffer).byteLength;
          onMessage(me.connectionId, ClientToServerMessageParser.toClientToServerMessage(message as ArrayBuffer));
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
    server.listen(port);
  }

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
  totalBytesSent = 0;
  totalBytesReceived = 0;
}

export interface IServerSocket {
  start(
    onJoin: (connectionId: string) => void,
    onLeave: (connectionId: string) => void,
    onMessage: (connectionId: string, message: ClientToServerMessage) => void
  ): void;

  sendMessage(connectionId: string, messages: ServerToClientMessage[]): void;
}
