import {ClientConfig} from '../clientConfig';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {WebSocketClient} from './webSocketClient';
import {SchemaDefiner} from '@common/schemaDefiner/schemaDefiner';
import {
  ClientToServerMessage,
  ClientToServerSchemaAdderFunction,
  ClientToServerSchemaAdderSizeFunction,
} from '@common/models/clientToServerMessages';
import {ServerToClientMessage, ServerToClientSchemaReaderFunction} from '@common/models/serverToClientMessages';
import {Jwt} from '../utils/jwt';
import {QueuedThrottle} from '../socket/queuedThrottle';
import {IClientSocket} from '../socket/IClientSocket';

export class LocalClientSocket implements IClientSocket {
  private socket?: WebSocketClient;
  private throttle = new QueuedThrottle();
  constructor() {
    this.throttle.execute = (m) => {
      this.socket!.send(m);
    };
  }
  connect(
    serverPath: string,
    options: {
      onDisconnect: () => void;
      onMessage: (messages: ServerToClientMessage[]) => void;
      onOpen: () => void;
    }
  ) {
    this.socket = new WebSocketClient(ClientConfig.websocketUrl(serverPath));
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = () => {
      options.onOpen();
    };
    this.socket.onerror = (e) => {
      console.log(e);
      this.socket?.close();
      options.onDisconnect();
    };
    this.socket.onmessage = (e) => {
      if (GameConstants.binaryTransport) {
        try {
          options.onMessage(SchemaDefiner.startReadSchemaBuffer(e.data, ServerToClientSchemaReaderFunction));
        } catch (ex) {
          console.error(ex);
        }
      } else {
        options.onMessage(JSON.parse(e.data));
      }
    };
    this.socket.onclose = () => {
      options.onDisconnect();
    };
  }

  disconnect() {
    this.socket?.close();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  sendMessage(message: ClientToServerMessage) {
    if (!this.socket) {
      throw new Error('Not connected');
    }
    try {
      if (GameConstants.binaryTransport) {
        this.socketSend(
          SchemaDefiner.startAddSchemaBuffer(
            message,
            ClientToServerSchemaAdderSizeFunction,
            ClientToServerSchemaAdderFunction
          )
        );
      } else {
        this.socketSend(JSON.stringify(message));
      }
    } catch (ex) {
      console.error('disconnected??', ex);
    }
  }

  private socketSend(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (!this.socket) {
      throw new Error('Not connected');
    }
    try {
      if (GameDebug.throttleClient) {
        this.throttle.sendMessage(data);
      } else {
        this.socket.send(data);
      }
    } catch (ex) {
      console.error('disconnected??', ex);
    }
  }
}
