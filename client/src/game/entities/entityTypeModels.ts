import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ShotEntity, ShotModel} from '@common/entities/shotEntity';
import {ShotExplosionEntity, ShotExplosionModel} from '@common/entities/shotExplosionEntity';
import {SwoopingEnemyEntity, SwoopingEnemyModel} from '@common/entities/swoopingEnemyEntity';
import {WallEntity, WallModel} from '@common/entities/wallEntity';
import {WorldStateEntity} from '@common/models/messages';
import {Entity} from '@common/entities/entity';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientEnemyShotEntity} from './clientEnemyShotEntity';
import {ClientShotEntity} from './clientShotEntity';
import {ClientShotExplosionEntity} from './clientShotExplosionEntity';
import {ClientSwoopingEnemyEntity} from './clientSwoopingEnemyEntity';
import {ClientWallEntity} from './clientWallEntity';
import {ClientGame} from '../clientGame';
import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';
import {ClientSpectatorEntity} from './clientSpectatorEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '@common/parsers/arrayBufferBuilder';

export type EntityModelType = {
  player: PlayerModel;
  enemyShot: EnemyShotModel;
  shot: ShotModel;
  shotExplosion: ShotExplosionModel;
  swoopingEnemy: SwoopingEnemyModel;
  wall: WallModel;
  spectator: SpectatorModel;
};

export const EntityTypes: {
  [key in WorldStateEntity['entityType']]: new (game: ClientGame, messageEntity: EntityModelType[key]) => Entity;
} = {
  player: ClientPlayerEntity,
  enemyShot: ClientEnemyShotEntity,
  shot: ClientShotEntity,
  shotExplosion: ClientShotExplosionEntity,
  swoopingEnemy: ClientSwoopingEnemyEntity,
  wall: ClientWallEntity,
  spectator: ClientSpectatorEntity,
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
};
