import {IServerSocket, ServerSocketOptions, SocketConnection} from '../../../server/src/serverSocket';
import {WebSocketServer} from './webSocketServer';
import {GameConstants} from '@common/game/gameConstants';
import {ArrayHash} from '@common/utils/arrayHash';
import {nextId} from '@common/utils/uuid';
import {ArrayBufferSchemaBuilder} from '@common/parsers/arrayBufferSchemaBuilder';
import {ServerToClientMessage, ServerToClientSchemaAdderFunction} from '@common/models/serverToClientMessages';
import {ClientToServerSchemaReaderFunction} from '@common/models/clientToServerMessages';

export class LocalServerSocket implements IServerSocket {
  connections = new ArrayHash<SocketConnection>('connectionId');
  time = +new Date();
  totalBytesReceived = 0;
  totalBytesSent = 0;
  wss?: WebSocketServer;
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
      const body = ArrayBufferSchemaBuilder.startAddSchemaBuffer(messages, ServerToClientSchemaAdderFunction);
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
    this.wss = new WebSocketServer({port, perMessageDeflate: false});

    this.wss.on('connection', (ws) => {
      ws.binaryType = 'arraybuffer';
      const me: SocketConnection = {
        socket: ws,
        connectionId: nextId(),
        spectatorJoin: +new Date(),
        lastAction: +new Date(),
        lastPing: +new Date(),
      };
      // console.log('new connection', me.connectionId);
      this.connections.push(me);

      ws.onmessage((message) => {
        if (GameConstants.binaryTransport) {
          this.totalBytesReceived += (message as ArrayBuffer).byteLength;
          const messageData = ArrayBufferSchemaBuilder.startReadSchemaBuffer(
            message as ArrayBuffer,
            ClientToServerSchemaReaderFunction
          );
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
        const connection = this.connections.lookup(me.connectionId);
        if (!connection) {
          return;
        }
        this.connections.remove(connection);
        onLeave(me.connectionId);
      };
      onJoin(me.connectionId);
    });
  }
}
