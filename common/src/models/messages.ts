import {LivePlayerModel, PlayerInput, PlayerModel} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';
import {LeaderboardEntry, LeaderboardEntryRanked} from '../game/gameLeaderboard';

export type ClientToServerMessage =
  | {
      name: string;
      type: 'join';
    }
  | {
      type: 'spectate';
    }
  | {
      ping: number;
      type: 'ping';
    }
  | ({
      type: 'playerInput';
    } & PlayerInput);

export type ErrorMessage = {
  reason: 'nameInUse';
  type: 'error';
};
export type ServerToClientMessage =
  | ({
      serverVersion: number;
      type: 'joined';
    } & LivePlayerModel)
  | {
      serverVersion: number;
      type: 'spectating';
    }
  | {ping: number; type: 'pong'}
  | ErrorMessage
  | {
      entities: EntityModels[];
      type: 'worldState';
    }
  | {
      scores: LeaderboardEntryRanked[];
      type: 'leaderboard';
    };
