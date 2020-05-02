import {ServerToClientMessage} from '@common/models/serverToClientMessages';
import {ClientToServerMessage} from '@common/models/clientToServerMessages';

export interface IClientSocket {
  connect(
    serverPath: string,
    options: {
      onDisconnect: () => void;
      onMessage: (messages: ServerToClientMessage[]) => void;
      onOpen: () => void;
    }
  ): void;

  disconnect(): void;

  isConnected(): boolean;

  sendMessage(message: ClientToServerMessage): void;
}
