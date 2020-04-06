import {SpectatorEntity, SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldEntity, PlayerShieldModel} from '../entities/playerShieldEntity';
import {ShotExplosionEntity, ShotExplosionModel} from '../entities/shotExplosionEntity';
import {EnemyShotEntity, EnemyShotModel} from '../entities/enemyShotEntity';
import {ShotEntity, ShotModel} from '../entities/shotEntity';
import {WallEntity, WallModel} from '../entities/wallEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {PlayerEntity, PlayerModel} from '../entities/playerEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export type WorldStateEntity =
  | PlayerModel
  | SpectatorModel
  | SwoopingEnemyModel
  | WallModel
  | ShotModel
  | ShotExplosionModel
  | EnemyShotModel
  | PlayerShieldModel;

export type EntityModelType = {
  player: PlayerModel;
  enemyShot: EnemyShotModel;
  shot: ShotModel;
  shotExplosion: ShotExplosionModel;
  swoopingEnemy: SwoopingEnemyModel;
  wall: WallModel;
  spectator: SpectatorModel;
  playerShield: PlayerShieldModel;
};

export type WorldEntityModelCastToEntityModel = any;

export const EntityBufferType: {
  [key in WorldStateEntity['entityType']]: {
    value: number;
    addBuffer: (buff: ArrayBufferBuilder, entityModel: EntityModelType[key]) => void;
    readBuffer: (reader: ArrayBufferReader) => EntityModelType[key];
  };
} = {
  player: {value: 1, addBuffer: PlayerEntity.addBuffer, readBuffer: PlayerEntity.readBuffer},
  enemyShot: {value: 2, addBuffer: EnemyShotEntity.addBuffer, readBuffer: EnemyShotEntity.readBuffer},
  shot: {value: 3, addBuffer: ShotEntity.addBuffer, readBuffer: ShotEntity.readBuffer},
  shotExplosion: {value: 4, addBuffer: ShotExplosionEntity.addBuffer, readBuffer: ShotExplosionEntity.readBuffer},
  swoopingEnemy: {value: 5, addBuffer: SwoopingEnemyEntity.addBuffer, readBuffer: SwoopingEnemyEntity.readBuffer},
  wall: {value: 6, addBuffer: WallEntity.addBuffer, readBuffer: WallEntity.readBuffer},
  spectator: {value: 7, addBuffer: SpectatorEntity.addBuffer, readBuffer: SpectatorEntity.readBuffer},
  playerShield: {value: 8, addBuffer: PlayerShieldEntity.addBuffer, readBuffer: PlayerShieldEntity.readBuffer},
};

export const EntityBufferValue: {
  [key: number]: WorldStateEntity['entityType'];
} = {
  1: 'player',
  2: 'enemyShot',
  3: 'shot',
  4: 'shotExplosion',
  5: 'swoopingEnemy',
  6: 'wall',
  7: 'spectator',
  8: 'playerShield',
};
