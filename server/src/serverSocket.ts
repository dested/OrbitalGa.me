///<reference path="./types/ws.d.ts"/>
import * as WebServer from 'ws';
import {GameConstants} from '@common/game/gameConstants';
import {createServer} from 'http';
import {ArrayHash} from '@common/utils/arrayHash';
import {nextId} from '@common/utils/uuid';
import {ArrayBufferSchema} from '@common/parsers/arrayBufferSchema';
import {ClientToServerMessage, ClientToServerSchema} from '@common/models/clientToServerMessages';
import {ServerToClientMessage, ServerToClientSchema} from '@common/models/serverToClientMessages';

export type SocketConnection = {
  connectionId: number;
  lastAction: number;
  lastPing: number;
  socket: ISocket;
  spectatorJoin: number;
};

export interface ISocket {
  binaryType: string;
  onclose: (result: any) => void;
  onmessage: (message: any) => void;
  close(): void;
  send(message: string | ArrayBuffer): void;
}

export type ServerSocketOptions = {
  onJoin: (connectionId: number) => void;
  onLeave: (connectionId: number) => void;
  onMessage: (connectionId: number, message: ClientToServerMessage) => void;
};
export class ServerSocket implements IServerSocket {
  connections = new ArrayHash<SocketConnection>('connectionId');

  time = +new Date();

  totalBytesReceived = 0;
  totalBytesSent = 0;
  wss?: WebServer.Server;
  private serverSocketOptions?: ServerSocketOptions;

  get totalBytesSentPerSecond() {
    return Math.round(this.totalBytesSent / ((+new Date() - this.time) / 1000));
  }

  disconnect(connectionId: number): void {
    const connection = this.connections.lookup(connectionId);
    if (connection) {
      connection.socket.close();
      this.connections.remove(connection);
      console.log('closed: connections', this.connections.length);
      this.serverSocketOptions?.onLeave(connectionId);
    }
  }

  sendMessage(connectionId: number, messages: ServerToClientMessage[]) {
    const client = this.connections.lookup(connectionId);
    if (!client) {
      return;
    }
    if (GameConstants.binaryTransport) {
      const body = ArrayBufferSchema.startAddSchemaBuffer(messages, ServerToClientSchema);
      this.totalBytesSent += body.byteLength;
      client.socket.send(body);
    } else {
      const body = JSON.stringify(messages);
      this.totalBytesSent += body.length * 2 + 1;
      client.socket.send(body);
    }
  }

  start(serverSocketOptions: ServerSocketOptions) {
    this.serverSocketOptions = serverSocketOptions;
    const {onJoin, onLeave, onMessage} = serverSocketOptions;

    const port = parseInt('8081');
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
      const me: SocketConnection = {
        socket: ws,
        connectionId: nextId(),
        spectatorJoin: +new Date(),
        lastAction: +new Date(),
        lastPing: +new Date(),
      };

      this.connections.push(me);
      const disconnect = () => {
        const connection = this.connections.lookup(me.connectionId);
        if (!connection) {
          return;
        }
        this.connections.remove(connection);
        // console.log('closed: connections', this.connections.length);
        onLeave(me.connectionId);
      };
      // console.log('opened: connections', this.connections.length);
      ws.on('message', (message) => {
        if (GameConstants.binaryTransport) {
          // console.log('got message', (message as ArrayBuffer).byteLength);
          this.totalBytesReceived += (message as ArrayBuffer).byteLength;
          if (!(message instanceof ArrayBuffer)) {
            console.log('bad connection');
            ws.close();
            return;
          }
          const messageData = ArrayBufferSchema.startReadSchemaBuffer(message as ArrayBuffer, ClientToServerSchema);
          if (messageData === null) {
            ws.close();
            return;
          }
          onMessage(me.connectionId, messageData);
        } else {
          onMessage(me.connectionId, JSON.parse(message as string));
        }
      });
      ws.on('error', (e) => {
        console.log('errored', e);
        disconnect();
      });

      ws.onclose = () => {
        disconnect();
      };
      onJoin(me.connectionId);
    });
    server.listen(port);
  }
}

export interface IServerSocket {
  connections: ArrayHash<SocketConnection>;
  totalBytesReceived: number;
  totalBytesSent: number;
  totalBytesSentPerSecond: number;

  disconnect(connectionId: number): void;
  sendMessage(connectionId: number, messages: ServerToClientMessage[]): void;
  start(serverSocketOptions: ServerSocketOptions): void;
}
