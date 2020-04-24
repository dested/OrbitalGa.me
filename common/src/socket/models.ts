import {ArrayHash} from '../utils/arrayHash';
import {ServerToClientMessage} from '../models/serverToClientMessages';
import {ClientToServerMessage} from '../models/clientToServerMessages';

export type SocketConnection = {
  connectionId: number;
  jwt: {isAnonymous: boolean; userId: number; userName: string} | {spectator: true};
  lastAction: number;
  lastPing: number;
  socket: ISocket;
  spectatorJoin?: number;
};

export interface ISocket {
  binaryType: string;
  onclose: (result: any) => void;
  onmessage: (message: any) => void;
  close(): void;
  send(message: string | ArrayBuffer): void;
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
export type ServerSocketOptions = {
  onJoin: (connectionId: number) => void;
  onLeave: (connectionId: number) => void;
  onMessage: (connectionId: number, message: ClientToServerMessage) => void;
};
