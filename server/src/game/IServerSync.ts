export interface IServerSync {
  setStat(serverStat: ServerStatSync): Promise<void>;
  startServer(): Promise<void>;
}

export type ServerStatSync = {
  boardWidth: number;
  bytesReceived: number;
  bytesSent: number;
  connections: number;
  duration: number;
  entities: number;
  entityGroupCount: string;
  memExternal: number;
  memHeapTotal: number;
  memHeapUsed: number;
  messages: number;
  spectators: number;
  tickIndex: number;
  totalBytesReceived: number;
  totalBytesSent: number;
  users: number;
};
