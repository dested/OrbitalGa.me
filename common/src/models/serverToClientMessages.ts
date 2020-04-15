import {LivePlayerModel, LivePlayerModelSchema, PlayerModelSchema} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';
import {LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {Size} from '../parsers/arrayBufferSchema';
import {WallModelSchema} from '../entities/wallEntity';
import {BossEvent1EnemyModelSchema} from '../entities/bossEvent1EnemyEntity';
import {BossEvent1ModelSchema} from '../entities/bossEvent1Entity';
import {PlayerWeaponModelSchema} from '../entities/playerWeaponEntity';
import {EnemyShotModelSchema} from '../entities/enemyShotEntity';
import {ExplosionModelSchema} from '../entities/explosionEntity';
import {PlayerShieldModelSchema} from '../entities/playerShieldEntity';
import {SwoopingEnemyModelSchema} from '../entities/swoopingEnemyEntity';
import {DropModelSchema} from '../entities/dropEntity';
import {SpectatorModelSchema} from '../entities/spectatorEntity';
import {MeteorModelSchema} from '../entities/meteorEntity';

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

export const ServerToClientSchema: Size<ServerToClientMessage[]> = {
  arraySize: 'uint16',
  typeLookup: true,
  pong: {type: 1, ping: 'uint8'},
  error: {type: 2, reason: {enum: true, nameInUse: 1}},
  joined: {type: 3, serverVersion: 'uint8', ...LivePlayerModelSchema, entityType: 'string'},
  leaderboard: {
    type: 4,
    scores: {
      arraySize: 'uint16',
      aliveTime: 'uint32',
      calculatedScore: 'uint32',
      damageGiven: 'uint32',
      damageTaken: 'uint32',
      enemiesKilled: 'uint32',
      eventsParticipatedIn: 'uint32',
      shotsFired: 'uint32',
      userId: 'uint32',
      username: 'string',
      rank: 'uint16',
    },
  },
  spectating: {type: 5, serverVersion: 'uint8'},
  worldState: {
    type: 6,
    entities: {
      arraySize: 'uint16',
      entityTypeLookup: true,
      spectator: SpectatorModelSchema,
      meteor: MeteorModelSchema,
      livePlayer: LivePlayerModelSchema,
      player: PlayerModelSchema,
      drop: DropModelSchema,
      wall: WallModelSchema,
      swoopingEnemy: SwoopingEnemyModelSchema,
      playerShield: PlayerShieldModelSchema,
      explosion: ExplosionModelSchema,
      enemyShot: EnemyShotModelSchema,
      playerWeapon: PlayerWeaponModelSchema,
      bossEvent1: BossEvent1ModelSchema,
      bossEvent1Enemy: BossEvent1EnemyModelSchema,
    },
  },
};
