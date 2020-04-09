import {SpectatorEntity, SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldEntity, PlayerShieldModel} from '../entities/playerShieldEntity';
import {ExplosionEntity, ShotExplosionModel} from '../entities/explosionEntity';
import {EnemyShotEntity, EnemyShotModel} from '../entities/enemyShotEntity';
import {ShotEntity, ShotModel} from '../entities/shotEntity';
import {WallEntity, WallModel} from '../entities/wallEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {PlayerEntity, PlayerModel} from '../entities/playerEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {MeteorEntity, MeteorModel} from '../entities/meteorEntity';
import {Utils} from '../utils/utils';
import {RocketEntity, RocketModel} from '../entities/rocketEntity';

export type EntityModelType = {
  enemyShot: EnemyShotModel;
  meteor: MeteorModel;
  player: PlayerModel;
  playerShield: PlayerShieldModel;
  rocket: RocketModel;
  shot: ShotModel;
  shotExplosion: ShotExplosionModel;
  spectator: SpectatorModel;
  swoopingEnemy: SwoopingEnemyModel;
  wall: WallModel;
};

export type WorldModel =
  | PlayerModel
  | SpectatorModel
  | SwoopingEnemyModel
  | WallModel
  | ShotModel
  | ShotExplosionModel
  | EnemyShotModel
  | PlayerShieldModel
  | MeteorModel
  | RocketModel;

export type WorldModelCastToEntityModel = any;
export const EntityBufferValue: {
  [key in WorldModel['entityType']]: number;
} = {
  player: 1,
  enemyShot: 2,
  shot: 3,
  shotExplosion: 4,
  swoopingEnemy: 5,
  wall: 6,
  spectator: 7,
  playerShield: 8,
  meteor: 9,
  rocket: 10,
};

export const EntityBufferValueLookup: {
  [key in number]: WorldModel['entityType'];
} = Utils.toDictionary(Utils.safeKeys(EntityBufferValue), (a) => EntityBufferValue[a]);

export const EntityBufferType: {
  [key in WorldModel['entityType']]: {
    addBuffer: (buff: ArrayBufferBuilder, entityModel: EntityModelType[key]) => void;
    readBuffer: (reader: ArrayBufferReader) => EntityModelType[key];
    value: number;
  };
} = {
  player: {value: EntityBufferValue.player, addBuffer: PlayerEntity.addBuffer, readBuffer: PlayerEntity.readBuffer},
  enemyShot: {
    value: EntityBufferValue.enemyShot,
    addBuffer: EnemyShotEntity.addBuffer,
    readBuffer: EnemyShotEntity.readBuffer,
  },
  shot: {value: EntityBufferValue.shot, addBuffer: ShotEntity.addBuffer, readBuffer: ShotEntity.readBuffer},
  shotExplosion: {
    value: EntityBufferValue.shotExplosion,
    addBuffer: ExplosionEntity.addBuffer,
    readBuffer: ExplosionEntity.readBuffer,
  },
  swoopingEnemy: {
    value: EntityBufferValue.swoopingEnemy,
    addBuffer: SwoopingEnemyEntity.addBuffer,
    readBuffer: SwoopingEnemyEntity.readBuffer,
  },
  wall: {value: EntityBufferValue.wall, addBuffer: WallEntity.addBuffer, readBuffer: WallEntity.readBuffer},
  spectator: {
    value: EntityBufferValue.spectator,
    addBuffer: SpectatorEntity.addBuffer,
    readBuffer: SpectatorEntity.readBuffer,
  },
  playerShield: {
    value: EntityBufferValue.playerShield,
    addBuffer: PlayerShieldEntity.addBuffer,
    readBuffer: PlayerShieldEntity.readBuffer,
  },
  meteor: {value: EntityBufferValue.meteor, addBuffer: MeteorEntity.addBuffer, readBuffer: MeteorEntity.readBuffer},
  rocket: {value: EntityBufferValue.rocket, addBuffer: RocketEntity.addBuffer, readBuffer: RocketEntity.readBuffer},
};
