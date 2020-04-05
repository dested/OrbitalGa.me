import {GameConstants} from '@common/game/gameConstants';
import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {ClientToServerMessageParser} from '@common/parsers/clientToServerMessageParser';
import {ServerToClientMessageParser} from '@common/parsers/serverToClientMessageParser';
import {ClientConfig} from './clientConfig';

export class ClientSocket implements IClientSocket {
  private socket?: WebSocket;
  connect(
    serverPath: string,
    options: {
      onOpen: () => void;
      onMessage: (messages: ServerToClientMessage[]) => void;
      onDisconnect: () => void;
    }
  ) {
    let totalLength = 0;
    this.socket = new WebSocket(ClientConfig.websocketUrl(serverPath));
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
        options.onMessage(ServerToClientMessageParser.toServerToClientMessages(e.data));
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

  sendMessage(message: ClientToServerMessage) {
    if (GameConstants.binaryTransport) {
      this.socketSend(ClientToServerMessageParser.fromClientToServerMessage(message));
    } else {
      this.socketSend(JSON.stringify(message));
    }
  }
  private socketSend(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (!this.socket) {
      throw new Error('Not connected');
    }
    try {
      if (GameConstants.throttleClient) {
        setTimeout(() => {
          this.socket!.send(data);
        }, 400);
      } else {
        this.socket.send(data);
      }
    } catch (ex) {
      console.error('disconnected??');
    }
  }

  disconnect() {
    this.socket?.close();
  }
}

export interface IClientSocket {
  connect(
    serverPath: string,
    options: {
      onOpen: () => void;
      onMessage: (messages: ServerToClientMessage[]) => void;
      onDisconnect: () => void;
    }
  ): void;

  sendMessage(message: ClientToServerMessage): void;

  disconnect(): void;
}
