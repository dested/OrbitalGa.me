import {
  LivePlayerModel,
  PlayerInput,
  PlayerInputKeyBitmask,
  PlayerInputKeys,
  PlayerModel,
  PlayerWeaponEnumSchema,
} from '../entities/playerEntity';
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
    keys: PlayerInputKeyBitmask,
    weapon: PlayerWeaponEnumSchema,
  },
};
