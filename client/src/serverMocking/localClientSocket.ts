import {IClientSocket} from '../clientSocket';
import {ClientConfig} from '../clientConfig';
import {GameConstants} from '@common/game/gameConstants';
import {WebSocketClient} from './webSocketClient';
import {ArrayBufferSchema} from '@common/parsers/arrayBufferSchema';
import {ClientToServerMessage, ClientToServerSchemaAdderFunction} from '@common/models/clientToServerMessages';
import {
  ServerToClientMessage,
  ServerToClientSchemaAdderFunction,
  ServerToClientSchemaReaderFunction,
} from '@common/models/serverToClientMessages';

export class LocalClientSocket implements IClientSocket {
  private socket?: WebSocketClient;

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
          options.onMessage(ArrayBufferSchema.startReadSchemaBuffer(e.data, ServerToClientSchemaReaderFunction));
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
        this.socket.send(ArrayBufferSchema.startAddSchemaBuffer(message, ClientToServerSchemaAdderFunction));
      } else {
        this.socket.send(JSON.stringify(message));
      }
    } catch (ex) {
      console.error('disconnected??', ex);
    }
  }
}
