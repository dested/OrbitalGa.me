import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {ClientConfig} from '../clientConfig';
import {SchemaDefiner} from '@common/schemaDefiner/schemaDefiner';
import {ServerToClientMessage, ServerToClientSchemaReaderFunction} from '@common/models/serverToClientMessages';
import {
  ClientToServerMessage,
  ClientToServerSchemaAdderFunction,
  ClientToServerSchemaAdderSizeFunction,
} from '@common/models/clientToServerMessages';
import {Jwt} from '../utils/jwt';
import {QueuedThrottle} from './queuedThrottle';
import {IClientSocket} from './IClientSocket';

export class ClientSocket implements IClientSocket {
  private socket?: WebSocket;
  private throttle = new QueuedThrottle();
  constructor(private jwt?: Jwt) {
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
    if (!this.jwt) {
      console.log('not authenticated');
      return;
    }
    let totalLength = 0;
    this.socket = new WebSocket(ClientConfig.websocketUrl(serverPath) + '?jwt=' + this.jwt);
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = () => {
      options.onOpen();
      console.count('opened');
    };
    this.socket.onerror = (e) => {
      // console.log(e.toString());
      console.log(JSON.stringify(e, null, 2));
      this.socket?.close();
      options.onDisconnect();
    };
    this.socket.onmessage = (e) => {
      if (GameConstants.binaryTransport) {
        totalLength += (e.data as ArrayBuffer).byteLength;
        const messages = SchemaDefiner.startReadSchemaBuffer(e.data, ServerToClientSchemaReaderFunction);
        options.onMessage(messages);
      } else {
        totalLength += e.data.length;
        options.onMessage(JSON.parse(e.data));
      }
      // console.log((totalLength / 1024).toFixed(2) + 'kb');
    };
    this.socket.onclose = () => {
      options.onDisconnect();
    };
  }

  disconnect() {
    this.socket?.close();
  }

  isConnected(): boolean {
    return !!this.socket && this.socket.readyState === this.socket.OPEN;
  }

  sendMessage(message: ClientToServerMessage) {
/*
    if (!this.isConnected()) {
      debugger;
    }
*/
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
