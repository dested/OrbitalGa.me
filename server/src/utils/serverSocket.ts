///<reference path="../types/ws.d.ts"/>

import * as WebServer from 'ws';
import * as url from 'url';
import {GameConstants} from '@common/game/gameConstants';
import {createServer} from 'http';
import {ArrayHash} from '@common/utils/arrayHash';
import {nextId} from '@common/utils/uuid';
import {SchemaDefiner} from '@common/schemaDefiner/schemaDefiner';
import {ClientToServerSchemaReaderFunction} from '@common/models/clientToServerMessages';
import {
  ServerToClientMessage,
  ServerToClientSchemaAdderFunction,
  ServerToClientSchemaAdderSizeFunction,
} from '@common/models/serverToClientMessages';
import {IServerSocket, ServerSocketOptions, SocketConnection} from '@common/socket/models';
import {AuthService} from '../../../api/server-common';

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
      // console.log('closed: connections', this.connections.length);
      this.serverSocketOptions?.onLeave(connectionId);
    }
  }

  sendMessage(connectionId: number, messages: ServerToClientMessage[]) {
    const client = this.connections.lookup(connectionId);
    if (!client) {
      return;
    }
    if (GameConstants.binaryTransport) {
      const body = SchemaDefiner.startAddSchemaBuffer(
        messages,
        ServerToClientSchemaAdderSizeFunction,
        ServerToClientSchemaAdderFunction
      );
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

    this.wss = new WebServer.Server({server, noServer: true, perMessageDeflate: false});
    this.wss.on('error', (a: any, b: any) => {
      console.error('error', a, b);
      throw a;
    });

    this.wss.on('connection', (ws, request) => {
      if (!request.url) {
        ws.close();
        return;
      }
      const query = url.parse(request.url).query;
      if (!query) {
        ws.close();
        return;
      }
      const [jwtKey, jwt] = query.split('=');
      if (jwtKey !== 'jwt' || !jwt) {
        ws.close();
        return;
      }

      let jwtUser: SocketConnection['jwt'];
      if (AuthService.validateSpectate(jwt)) {
        jwtUser = {spectator: true};
      } else {
        const jwtResult = AuthService.validate(jwt);
        if (!jwtResult) {
          ws.close();
          return;
        }
        jwtUser = jwtResult;
      }
      ws.binaryType = 'arraybuffer';
      const me: SocketConnection = {
        socket: ws,
        connectionId: nextId(),
        lastAction: +new Date(),
        lastPing: +new Date(),
        jwt: jwtUser,
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
          try {
            if (!(message instanceof ArrayBuffer)) {
              console.log('bad connection');
              ws.close();
              return;
            }
            this.totalBytesReceived += (message as ArrayBuffer).byteLength;
            const messageData = SchemaDefiner.startReadSchemaBuffer(
              message as ArrayBuffer,
              ClientToServerSchemaReaderFunction
            );
            if (messageData === null) {
              ws.close();
              return;
            }
            onMessage(me.connectionId, messageData);
          } catch (ex) {
            ws.close();
            return;
          }
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
