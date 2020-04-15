import {LivePlayerModel, PlayerInput, PlayerInputKeys, PlayerModel} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';
import {LeaderboardEntry, LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {PlayerWeapon} from '../game/gameRules';
import {Size} from '../parsers/arrayBufferSchema';

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
  | {
      inputSequenceNumber: number;
      keys: PlayerInputKeys;
      type: 'playerInput';
      weapon?: PlayerWeapon;
    };

export const ClientToServerSchema: Size<ClientToServerMessage> = {
  typeLookup: true,
  ping: {type: 1, ping: 'uint32'},
  join: {type: 2, name: 'string'},
  spectate: {type: 3},
  playerInput: {
    type: 4,
    inputSequenceNumber: 'uint32',
    keys: {
      bitmask: true,
      shoot: 0,
      right: 1,
      left: 2,
      up: 3,
      down: 4,
    },
    weapon: {
      enum: true,
      laser2: 1,
      laser1: 2,
      rocket: 3,
      torpedo: 4,
    },
  },
};
