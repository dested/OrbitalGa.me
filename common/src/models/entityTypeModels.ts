import {SpectatorEntity, SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldEntity, PlayerShieldModel} from '../entities/playerShieldEntity';
import {ExplosionEntity, ExplosionModel} from '../entities/explosionEntity';
import {EnemyShotEntity, EnemyShotModel} from '../entities/enemyShotEntity';
import {PlayerWeaponEntity, PlayerWeaponModel} from '../entities/playerWeaponEntity';
import {WallEntity, WallModel} from '../entities/wallEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {LivePlayerModel, PlayerEntity, PlayerModel} from '../entities/playerEntity';
import {MeteorEntity, MeteorModel} from '../entities/meteorEntity';
import {DropEntity, DropModel} from '../entities/dropEntity';
import {BossEvent1Entity, BossEvent1Model} from '../entities/bossEvent1Entity';
import {BossEvent1EnemyEntity, BossEvent1EnemyModel} from '../entities/bossEvent1EnemyEntity';

/* tslint:disable:member-ordering */
export type EntityType = {
  player: {entity: PlayerEntity; model: PlayerModel};
  meteor: {entity: MeteorEntity; model: MeteorModel};
  enemyShot: {entity: EnemyShotEntity; model: EnemyShotModel};
  playerShield: {entity: PlayerShieldEntity; model: PlayerShieldModel};
  playerWeapon: {entity: PlayerWeaponEntity; model: PlayerWeaponModel};
  explosion: {entity: ExplosionEntity; model: ExplosionModel};
  spectator: {entity: SpectatorEntity; model: SpectatorModel};
  swoopingEnemy: {entity: SwoopingEnemyEntity; model: SwoopingEnemyModel};
  wall: {entity: WallEntity; model: WallModel};
  livePlayer: {entity: PlayerEntity; model: LivePlayerModel};
  drop: {entity: DropEntity; model: DropModel};
  bossEvent1: {entity: BossEvent1Entity; model: BossEvent1Model};
  bossEvent1Enemy: {entity: BossEvent1EnemyEntity; model: BossEvent1EnemyModel};
};

export type EntityModels = EntityType[keyof EntityType]['model'];

export type WorldModelCastToEntityModel = any;

export type ImpliedEntityType<T> = Omit<T, 'type'>;

export const EntityTypeLookup: {
  [key in EntityModels['type']]: number;
} = {
  player: 1,
  meteor: 2,
  enemyShot: 3,
  playerShield: 4,
  playerWeapon: 5,
  explosion: 6,
  spectator: 7,
  swoopingEnemy: 8,
  wall: 9,
  livePlayer: 10,
  drop: 11,
  bossEvent1: 12,
  bossEvent1Enemy: 13,
};
