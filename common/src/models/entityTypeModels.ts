import {SpectatorEntity, SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldEntity, PlayerShieldModel} from '../entities/playerShieldEntity';
import {ExplosionEntity, ExplosionModel} from '../entities/explosionEntity';
import {EnemyShotEntity, EnemyShotModel} from '../entities/enemyShotEntity';
import {PlayerWeaponEntity, PlayerWeaponModel} from '../entities/playerWeaponEntity';
import {WallEntity, WallModel} from '../entities/wallEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {LivePlayerModel, PlayerEntity, PlayerModel} from '../entities/playerEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {MeteorEntity, MeteorModel} from '../entities/meteorEntity';
import {Utils} from '../utils/utils';
import {DropEntity, DropModel} from '../entities/dropEntity';
import {BossEvent1Entity, BossEvent1Model} from '../entities/bossEvent1Entity';
import {BossEvent1EnemyEntity, BossEvent1EnemyModel} from '../entities/bossEvent1EnemyEntity';

/* tslint:disable:member-ordering */
export type EntityType = {
  player: {entity: PlayerEntity; index: 1; model: PlayerModel};
  meteor: {entity: MeteorEntity; index: 2; model: MeteorModel};
  enemyShot: {entity: EnemyShotEntity; index: 3; model: EnemyShotModel};
  playerShield: {entity: PlayerShieldEntity; index: 4; model: PlayerShieldModel};
  playerWeapon: {entity: PlayerWeaponEntity; index: 5; model: PlayerWeaponModel};
  explosion: {entity: ExplosionEntity; index: 6; model: ExplosionModel};
  spectator: {entity: SpectatorEntity; index: 7; model: SpectatorModel};
  swoopingEnemy: {entity: SwoopingEnemyEntity; index: 8; model: SwoopingEnemyModel};
  wall: {entity: WallEntity; index: 9; model: WallModel};
  livePlayer: {entity: PlayerEntity; index: 10; model: LivePlayerModel};
  drop: {entity: DropEntity; index: 11; model: DropModel};
  bossEvent1: {entity: BossEvent1Entity; index: 12; model: BossEvent1Model};
  bossEvent1Enemy: {entity: BossEvent1EnemyEntity; index: 13; model: BossEvent1EnemyModel};
};

export type EntityModels = EntityType[keyof EntityType]['model'];

export type WorldModelCastToEntityModel = any;

export type ImpliedEntityType<T> = Omit<T, 'entityType'>;
