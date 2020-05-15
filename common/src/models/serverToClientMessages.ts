import {
  LivePlayerModel,
  LivePlayerModelSchema,
  PlayerEntity,
  PlayerModel,
  PlayerModelSchema,
} from '../entities/playerEntity';
import {LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {SDArray, SDTypeLookup, SDTypeLookupElements} from '../schemaDefiner/schemaDefinerTypes';
import {WallEntity, WallModel, WallModelSchema} from '../entities/wallEntity';
import {
  BossEvent1EnemyEntity,
  BossEvent1EnemyModel,
  BossEvent1EnemyModelSchema,
} from '../entities/bossEvent1EnemyEntity';
import {BossEvent1Entity, BossEvent1Model, BossEvent1ModelSchema} from '../entities/bossEvent1Entity';
import {PlayerWeaponEntity, PlayerWeaponModel, PlayerWeaponModelSchema} from '../entities/playerWeaponEntity';
import {EnemyShotEntity, EnemyShotModel, EnemyShotModelSchema} from '../entities/enemyShotEntity';
import {ExplosionEntity, ExplosionModel, ExplosionModelSchema} from '../entities/explosionEntity';
import {PlayerShieldEntity, PlayerShieldModel, PlayerShieldModelSchema} from '../entities/playerShieldEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel, SwoopingEnemyModelSchema} from '../entities/swoopingEnemyEntity';
import {DropEntity, DropModel, DropModelSchema} from '../entities/dropEntity';
import {SpectatorEntity, SpectatorModel, SpectatorModelSchema} from '../entities/spectatorEntity';
import {MeteorEntity, MeteorModel, MeteorModelSchema} from '../entities/meteorEntity';
import {SchemaDefiner} from '../schemaDefiner/schemaDefiner';
import {ScoreEntity, ScoreModel, ScoreModelSchema} from '../entities/scoreEntity';

export type EntityType = {
  bossEvent1: {entity: BossEvent1Entity; model: BossEvent1Model};
  bossEvent1Enemy: {entity: BossEvent1EnemyEntity; model: BossEvent1EnemyModel};
  drop: {entity: DropEntity; model: DropModel};
  enemyShot: {entity: EnemyShotEntity; model: EnemyShotModel};
  explosion: {entity: ExplosionEntity; model: ExplosionModel};
  livePlayer: {entity: PlayerEntity; model: LivePlayerModel};
  meteor: {entity: MeteorEntity; model: MeteorModel};
  player: {entity: PlayerEntity; model: PlayerModel};
  playerShield: {entity: PlayerShieldEntity; model: PlayerShieldModel};
  playerWeapon: {entity: PlayerWeaponEntity; model: PlayerWeaponModel};
  score: {entity: ScoreEntity; model: ScoreModel};
  spectator: {entity: SpectatorEntity; model: SpectatorModel};
  swoopingEnemy: {entity: SwoopingEnemyEntity; model: SwoopingEnemyModel};
  wall: {entity: WallEntity; model: WallModel};
};

export type EntityModels = EntityType[keyof EntityType]['model'];

export type ImpliedEntityType<T> = Omit<T, 'type'>;

type STOCJoined = {
  playerEntityId: number;
  serverVersion: number;
  stepCount: number;
  type: 'joined';
};
type STOCSpectating = {serverVersion: number; type: 'spectating'};
type STOCPong = {ping: number; type: 'pong'};
export type STOCError =
  | {reason: 'nameInUse'; type: 'error'}
  | {reason: '500'; type: 'error'}
  | {reason: 'spectatorCapacity'; type: 'error'}
  | {reason: 'userCapacity'; type: 'error'};
export type STOCWorldState = {
  entities: EntityModels[];
  stepCount: number;
  totalPlayers: number;
  type: 'worldState';
};
type STOCLeaderboard = {scores: LeaderboardEntryRanked[]; type: 'leaderboard'};

export type ServerToClientMessage =
  | STOCJoined
  | STOCSpectating
  | STOCPong
  | STOCError
  | STOCWorldState
  | STOCLeaderboard;

const STOCPongSchema: SDTypeLookup<ServerToClientMessage, 'pong'> = {ping: 'uint32'};
const STOCErrorSchema: SDTypeLookup<ServerToClientMessage, 'error'> = {
  reason: {flag: 'enum', nameInUse: 1, '500': 2, spectatorCapacity: 3, userCapacity: 4},
};
const STOCJoinedSchema: SDTypeLookup<ServerToClientMessage, 'joined'> = {
  stepCount: 'uint32',
  serverVersion: 'uint8',
  playerEntityId: 'int32',
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
  totalPlayers: 'uint16',
  stepCount: 'uint32',
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
        score: ScoreModelSchema,
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
export const ServerToClientSchemaAdderSizeFunction = SchemaDefiner.generateAdderSizeFunction(ServerToClientSchema);
