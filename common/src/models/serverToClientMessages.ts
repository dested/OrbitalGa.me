import {LivePlayerModel, LivePlayerModelSchema, PlayerModelSchema} from '../entities/playerEntity';
import {EntityBufferValue, EntityModels} from './entityTypeModels';
import {LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {AB, ABByType, ABSizeByType} from '../parsers/arrayBufferSchemaTypes';
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

type STOCJoined = {serverVersion: number; type: 'joined'} & LivePlayerModel;
type STOCSpectating = {serverVersion: number; type: 'spectating'};
type STOCPong = {ping: number; type: 'pong'};
export type STOCError = {reason: 'nameInUse'; type: 'error'};
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
  reason: {flag: 'enum', nameInUse: 1},
};
const STOCJoinedSchema: ABByType<ServerToClientMessage, 'joined'> = {
  type: STOCTypes.joined,
  serverVersion: 'uint8',
  ...LivePlayerModelSchema,
  entityType: 'string',
};
const STOCLeaderboardSchema: ABByType<ServerToClientMessage, 'leaderboard'> = {
  type: STOCTypes.leaderboard,
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
};
const STOCSpectatingSchema: ABByType<ServerToClientMessage, 'spectating'> = {
  type: STOCTypes.spectating,
  serverVersion: 'uint8',
};

export type EntityModelSchemaType<TEntityModelType extends EntityModels['entityType']> = Omit<
  ABSizeByType<EntityModels, TEntityModelType>,
  'entityType'
>;

const STOCWorldStateSchema: ABByType<ServerToClientMessage, 'worldState'> = {
  type: STOCTypes.worldState,
  entities: {
    arraySize: 'uint16',
    flag: 'entity-type-lookup',
    spectator: {entityType: EntityBufferValue.spectator, ...SpectatorModelSchema},
    meteor: {entityType: EntityBufferValue.meteor, ...MeteorModelSchema},
    livePlayer: {entityType: EntityBufferValue.livePlayer, ...LivePlayerModelSchema},
    player: {entityType: EntityBufferValue.player, ...PlayerModelSchema},
    drop: {entityType: EntityBufferValue.drop, ...DropModelSchema},
    wall: {entityType: EntityBufferValue.wall, ...WallModelSchema},
    swoopingEnemy: {entityType: EntityBufferValue.swoopingEnemy, ...SwoopingEnemyModelSchema},
    playerShield: {entityType: EntityBufferValue.playerShield, ...PlayerShieldModelSchema},
    explosion: {entityType: EntityBufferValue.explosion, ...ExplosionModelSchema},
    enemyShot: {entityType: EntityBufferValue.enemyShot, ...EnemyShotModelSchema},
    playerWeapon: {entityType: EntityBufferValue.playerWeapon, ...PlayerWeaponModelSchema},
    bossEvent1: {entityType: EntityBufferValue.bossEvent1, ...BossEvent1ModelSchema},
    bossEvent1Enemy: {entityType: EntityBufferValue.bossEvent1Enemy, ...BossEvent1EnemyModelSchema},
  },
};

export const ServerToClientSchema: AB<ServerToClientMessage[]> = {
  arraySize: 'uint16',
  flag: 'type-lookup',
  pong: STOCPongSchema,
  error: STOCErrorSchema,
  joined: STOCJoinedSchema,
  leaderboard: STOCLeaderboardSchema,
  spectating: STOCSpectatingSchema,
  worldState: STOCWorldStateSchema,
};
