import {PlayerModel} from '@common/entities/playerEntity';
import {EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ShotModel} from '@common/entities/shotEntity';
import {ShotExplosionModel} from '@common/entities/shotExplosionEntity';
import {SwoopingEnemyModel} from '@common/entities/swoopingEnemyEntity';
import {WallModel} from '@common/entities/wallEntity';
import {WorldStateEntity} from '@common/models/messages';
import {Entity} from '@common/entities/entity';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientEnemyShotEntity} from './clientEnemyShotEntity';
import {ClientShotEntity} from './clientShotEntity';
import {ClientShotExplosionEntity} from './clientShotExplosionEntity';
import {ClientSwoopingEnemyEntity} from './clientSwoopingEnemyEntity';
import {ClientWallEntity} from './clientWallEntity';
import {ClientGame} from '../clientGame';

export type EntityModelType = {
  player: PlayerModel;
  enemyShot: EnemyShotModel;
  shot: ShotModel;
  shotExplosion: ShotExplosionModel;
  swoopingEnemy: SwoopingEnemyModel;
  wall: WallModel;
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
};

export type WorldEntityModelCastToEntityModel = any;
