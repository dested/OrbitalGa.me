import {SpectatorEntity, SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldEntity, PlayerShieldModel} from '../entities/playerShieldEntity';
import {ExplosionEntity, ExplosionModel} from '../entities/explosionEntity';
import {EnemyShotEntity, EnemyShotModel} from '../entities/enemyShotEntity';
import {ShotEntity, ShotModel} from '../entities/shotEntity';
import {WallEntity, WallModel} from '../entities/wallEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {PlayerEntity, PlayerModel} from '../entities/playerEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {MeteorEntity, MeteorModel} from '../entities/meteorEntity';
import {Utils} from '../utils/utils';
import {RocketEntity, RocketModel} from '../entities/rocketEntity';

export type EntityType = {
  enemyShot: {entity: EnemyShotEntity; index: 1; model: EnemyShotModel};
  explosion: {entity: ExplosionEntity; index: 7; model: ExplosionModel};
  meteor: {entity: MeteorEntity; index: 2; model: MeteorModel};
  player: {entity: PlayerEntity; index: 3; model: PlayerModel};
  playerShield: {entity: PlayerShieldEntity; index: 4; model: PlayerShieldModel};
  rocket: {entity: RocketEntity; index: 5; model: RocketModel};
  shot: {entity: ShotEntity; index: 6; model: ShotModel};
  spectator: {entity: SpectatorEntity; index: 8; model: SpectatorModel};
  swoopingEnemy: {entity: SwoopingEnemyEntity; index: 9; model: SwoopingEnemyModel};
  wall: {entity: WallEntity; index: 10; model: WallModel};
};

export type EntityModels = EntityType[keyof EntityType]['model'];

export type WorldModelCastToEntityModel = any;

export const EntityBufferValue: {
  [key in EntityModels['entityType']]: EntityType[keyof EntityType]['index'];
} = {
  player: 1,
  enemyShot: 2,
  shot: 3,
  explosion: 4,
  swoopingEnemy: 5,
  wall: 6,
  spectator: 7,
  playerShield: 8,
  meteor: 9,
  rocket: 10,
};

export const EntityBufferValueLookup: {
  [key in number]: EntityModels['entityType'];
} = Utils.toDictionary(Utils.safeKeys(EntityBufferValue), (a) => EntityBufferValue[a]);

export const EntityBufferType: {
  [key in EntityModels['entityType']]: {
    addBuffer: (buff: ArrayBufferBuilder, entityModel: EntityType[key]['model']) => void;
    readBuffer: (reader: ArrayBufferReader) => EntityType[key]['model'];
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
  explosion: {
    value: EntityBufferValue.explosion,
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
