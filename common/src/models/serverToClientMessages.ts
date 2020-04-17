import {LivePlayerModel, LivePlayerModelSchema, PlayerModelSchema} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';
import {LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {SDArray, SDTypeLookup, SDTypeLookupElements} from '../schemaDefiner/schemaDefinerTypes';
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
import {SchemaDefiner} from '../schemaDefiner/schemaDefiner';

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

const STOCPongSchema: SDTypeLookup<ServerToClientMessage, 'pong'> = {ping: 'uint8'};
const STOCErrorSchema: SDTypeLookup<ServerToClientMessage, 'error'> = {
  reason: {flag: 'enum', nameInUse: 1, '500': 2},
};
const STOCJoinedSchema: SDTypeLookup<ServerToClientMessage, 'joined'> = {
  serverVersion: 'uint8',
  player: LivePlayerModelSchema,
};
const STOCLeaderboardSchema: SDTypeLookup<ServerToClientMessage, 'leaderboard'> = {
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
const STOCSpectatingSchema: SDTypeLookup<ServerToClientMessage, 'spectating'> = {
  serverVersion: 'uint8',
};

export type EntityModelSchemaType<TEntityModelType extends EntityModels['type']> = SDTypeLookup<
  EntityModels,
  TEntityModelType
>;

const STOCWorldStateSchema: SDTypeLookup<ServerToClientMessage, 'worldState'> = {
  entities: {
    flag: 'array-uint16',
    elements: {
      flag: 'type-lookup',
      elements: {
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
  },
};

const ServerToClientSchema: SDArray<SDTypeLookupElements<ServerToClientMessage>> = {
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
export const ServerToClientSchemaReaderFunction = SchemaDefiner.generateReaderFunction(ServerToClientSchema);
export const ServerToClientSchemaAdderFunction = SchemaDefiner.generateAdderFunction(ServerToClientSchema);
