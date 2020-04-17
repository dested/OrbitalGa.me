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
  spectator: {entity: SpectatorEntity; model: SpectatorModel};
  swoopingEnemy: {entity: SwoopingEnemyEntity; model: SwoopingEnemyModel};
  wall: {entity: WallEntity; model: WallModel};
};

export type EntityModels = EntityType[keyof EntityType]['model'];

export type WorldModelCastToEntityModel = any;

export type ImpliedEntityType<T> = Omit<T, 'type'>;
