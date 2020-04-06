import {IClientSocket} from '../clientSocket';
import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {ClientConfig} from '../clientConfig';
import {GameConstants} from '@common/game/gameConstants';
import {ServerToClientMessageParser} from '@common/parsers/serverToClientMessageParser';
import {ClientToServerMessageParser} from '@common/parsers/clientToServerMessageParser';
import {WebSocketClient} from './webSocketClient';

export class LocalClientSocket implements IClientSocket {
  private socket?: WebSocketClient;

  connect(
    serverPath: string,
    options: {
      onOpen: () => void;
      onMessage: (messages: ServerToClientMessage[]) => void;
      onDisconnect: () => void;
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
        options.onMessage(ServerToClientMessageParser.toServerToClientMessages(e.data));
      } else {
        options.onMessage(JSON.parse(e.data));
      }
    };
    this.socket.onclose = () => {
      options.onDisconnect();
    };
  }

  sendMessage(message: ClientToServerMessage) {
    if (!this.socket) {
      throw new Error('Not connected');
    }
    try {
      if (GameConstants.binaryTransport) {
        this.socket.send(ClientToServerMessageParser.fromClientToServerMessage(message));
      } else {
        this.socket.send(JSON.stringify(message));
      }
    } catch (ex) {
      console.error('disconnected??');
    }
  }

  disconnect() {
    this.socket?.close();
  }
}
