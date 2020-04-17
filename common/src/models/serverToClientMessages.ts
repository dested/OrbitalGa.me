import {LivePlayerModel, LivePlayerModelSchema, PlayerModelSchema} from '../entities/playerEntity';
import {EntityBufferValue, EntityModels} from './entityTypeModels';
import {LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {AB, ABArray, ABByType, ABEntityTypeLookup, ABKeys, ABTypeLookup} from '../parsers/arrayBufferSchemaTypes';
import {WallModelSchema} from '../entities/wallEntity';
import {BossEvent1EnemyModelSchema} from '../entities/bossEvent1EnemyEntity';
import {BossEvent1ModelSchema} from '../entities/bossEvent1Entity';
import {PlayerWeaponModelSchema} from '../entities/playerWeaponEntity';
import {EnemyShotModelSchema} from '../entities/enemyShotEntity';
import {ExplosionModelSchema} from '../entities/explosionEntity';
import {PlayerShieldModelSchema} from '../entities/playerShieldEntity';
import {SwoopingEnemyModelSchema} from '../entities/swoopingEnemyEntity';
import {DropModelSchema} from '../entities/dropEntity';
import {SpectatorModel, SpectatorModelSchema} from '../entities/spectatorEntity';
import {MeteorModelSchema} from '../entities/meteorEntity';
import {ArrayBufferSchemaBuilder} from '../parsers/arrayBufferSchemaBuilder';

type STOCJoined = {player: Omit<LivePlayerModel, 'type'>; serverVersion: number; type: 'joined'};
type STOCSpectating = {serverVersion: number; type: 'spectating'};
type STOCPong = {ping: number; type: 'pong'};
export type STOCError = {reason: 'nameInUse'; type: 'error'} | {reason: '500'; type: 'error'};
type STOCWorldState = {entities: EntityModels[]; type: 'worldState'};
type STOCLeaderboard = {scores: LeaderboardEntryRanked[]; type: 'leaderboard'};

export type ServerToClientMessage =
  | STOCJoined
  | STOCSpectating
  | STOCPong
  | STOCError
  | STOCWorldState
  | STOCLeaderboard;

const STOCTypes: {[key in ServerToClientMessage['type']]: number} = {
  spectating: 1,
  leaderboard: 2,
  joined: 3,
  error: 4,
  pong: 5,
  worldState: 6,
};

const STOCPongSchema: ABByType<ServerToClientMessage, 'pong'> = {type: STOCTypes.pong, ping: 'uint8'};
const STOCErrorSchema: ABByType<ServerToClientMessage, 'error'> = {
  type: STOCTypes.error,
  reason: {flag: 'enum', nameInUse: 1, '500': 2},
};
const STOCJoinedSchema: ABByType<ServerToClientMessage, 'joined'> = {
  type: STOCTypes.joined,
  serverVersion: 'uint8',
  player: LivePlayerModelSchema,
};
const STOCLeaderboardSchema: ABByType<ServerToClientMessage, 'leaderboard'> = {
  type: STOCTypes.leaderboard,
  scores: {
    flag: 'array-uint16',
    elements: {
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
};
const STOCSpectatingSchema: ABByType<ServerToClientMessage, 'spectating'> = {
  type: STOCTypes.spectating,
  serverVersion: 'uint8',
};

export type EntityModelSchemaType<TEntityModelType extends EntityModels['type']> = Omit<
  ABByType<EntityModels, TEntityModelType>,
  'type'
>;

const STOCWorldStateSchema: ABByType<ServerToClientMessage, 'worldState'> = {
  type: STOCTypes.worldState,
  entities: {
    flag: 'array-uint16',
    elements: {
      flag: 'type-lookup',
      elements: {
        spectator: {type: EntityBufferValue.spectator, ...SpectatorModelSchema},
        meteor: {type: EntityBufferValue.meteor, ...MeteorModelSchema},
        livePlayer: {type: EntityBufferValue.livePlayer, ...LivePlayerModelSchema},
        player: {type: EntityBufferValue.player, ...PlayerModelSchema},
        drop: {type: EntityBufferValue.drop, ...DropModelSchema},
        wall: {type: EntityBufferValue.wall, ...WallModelSchema},
        swoopingEnemy: {type: EntityBufferValue.swoopingEnemy, ...SwoopingEnemyModelSchema},
        playerShield: {type: EntityBufferValue.playerShield, ...PlayerShieldModelSchema},
        explosion: {type: EntityBufferValue.explosion, ...ExplosionModelSchema},
        enemyShot: {type: EntityBufferValue.enemyShot, ...EnemyShotModelSchema},
        playerWeapon: {type: EntityBufferValue.playerWeapon, ...PlayerWeaponModelSchema},
        bossEvent1: {type: EntityBufferValue.bossEvent1, ...BossEvent1ModelSchema},
        bossEvent1Enemy: {type: EntityBufferValue.bossEvent1Enemy, ...BossEvent1EnemyModelSchema},
      },
    },
  },
};

const ServerToClientSchema: ABArray<ABTypeLookup<ABKeys<ServerToClientMessage>>> = {
  flag: 'array-uint16',
  elements: {
    flag: 'type-lookup',
    elements: {
      pong: STOCPongSchema,
      error: STOCErrorSchema,
      joined: STOCJoinedSchema,
      leaderboard: STOCLeaderboardSchema,
      spectating: STOCSpectatingSchema,
      worldState: STOCWorldStateSchema,
    },
  },
};
export const ServerToClientSchemaReaderFunction = ArrayBufferSchemaBuilder.generateReaderFunction(ServerToClientSchema);
export const ServerToClientSchemaAdderFunction = ArrayBufferSchemaBuilder.generateAdderFunction(ServerToClientSchema);
