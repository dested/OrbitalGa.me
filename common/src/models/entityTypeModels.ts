import {SpectatorEntity, SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldEntity, PlayerShieldModel} from '../entities/playerShieldEntity';
import {ExplosionEntity, ExplosionModel} from '../entities/explosionEntity';
import {EnemyShotEntity, EnemyShotModel} from '../entities/enemyShotEntity';
import {PlayerWeaponEntity, ShotModel} from '../entities/playerWeaponEntity';
import {WallEntity, WallModel} from '../entities/wallEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {LivePlayerModel, PlayerEntity, PlayerModel} from '../entities/playerEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {MeteorEntity, MeteorModel} from '../entities/meteorEntity';
import {Utils} from '../utils/utils';
import {DropEntity, DropModel} from '../entities/dropEntity';

/* tslint:disable:member-ordering */
export type EntityType = {
  player: {entity: PlayerEntity; index: 1; model: PlayerModel};
  meteor: {entity: MeteorEntity; index: 2; model: MeteorModel};
  enemyShot: {entity: EnemyShotEntity; index: 3; model: EnemyShotModel};
  playerShield: {entity: PlayerShieldEntity; index: 4; model: PlayerShieldModel};
  playerWeapon: {entity: PlayerWeaponEntity; index: 5; model: ShotModel};
  explosion: {entity: ExplosionEntity; index: 6; model: ExplosionModel};
  spectator: {entity: SpectatorEntity; index: 7; model: SpectatorModel};
  swoopingEnemy: {entity: SwoopingEnemyEntity; index: 8; model: SwoopingEnemyModel};
  wall: {entity: WallEntity; index: 9; model: WallModel};
  livePlayer: {entity: PlayerEntity; index: 10; model: LivePlayerModel};
  drop: {entity: DropEntity; index: 11; model: DropModel};
};

export type EntityModels = EntityType[keyof EntityType]['model'];

export type WorldModelCastToEntityModel = any;

export const EntityBufferValue: {
  [key in EntityModels['entityType']]: EntityType[keyof EntityType]['index'];
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
  livePlayer: {
    value: EntityBufferValue.livePlayer,
    addBuffer: PlayerEntity.addBufferLive,
    readBuffer: PlayerEntity.readBufferLive,
  },
  enemyShot: {
    value: EntityBufferValue.enemyShot,
    addBuffer: EnemyShotEntity.addBuffer,
    readBuffer: EnemyShotEntity.readBuffer,
  },
  playerWeapon: {
    value: EntityBufferValue.playerWeapon,
    addBuffer: PlayerWeaponEntity.addBuffer,
    readBuffer: PlayerWeaponEntity.readBuffer,
  },
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
  drop: {value: EntityBufferValue.drop, addBuffer: DropEntity.addBuffer, readBuffer: DropEntity.readBuffer},
};
