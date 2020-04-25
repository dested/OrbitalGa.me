import {LeaderboardEntry, LeaderboardEntryUserDetails} from '@common/game/gameLeaderboard';

export interface IServerSync {
  setLeaderboardEntry(activePlayerScore: LeaderboardEntry & LeaderboardEntryUserDetails): void;
  setStat(serverStat: ServerStatSync): Promise<void>;
  startServer(): Promise<void>;
  syncLeaderboard(): Promise<void>;
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
