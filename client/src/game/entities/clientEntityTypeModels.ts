import {ClientSpectatorEntity} from './clientSpectatorEntity';
import {Entity} from '@common/entities/entity';
import {EntityModelType, WorldStateEntity} from '@common/models/entityTypeModels';
import {ClientShotExplosionEntity} from './clientShotExplosionEntity';
import {ClientPlayerShieldEntity} from './clientPlayerShieldEntity';
import {ClientSwoopingEnemyEntity} from './clientSwoopingEnemyEntity';
import {ClientShotEntity} from './clientShotEntity';
import {ClientWallEntity} from './clientWallEntity';
import {ClientGame} from '../clientGame';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientEnemyShotEntity} from './clientEnemyShotEntity';

export const ClientEntityTypes: {
  [key in WorldStateEntity['entityType']]: new (game: ClientGame, messageEntity: EntityModelType[key]) => Entity;
} = {
  player: ClientPlayerEntity,
  enemyShot: ClientEnemyShotEntity,
  shot: ClientShotEntity,
  shotExplosion: ClientShotExplosionEntity,
  swoopingEnemy: ClientSwoopingEnemyEntity,
  wall: ClientWallEntity,
  spectator: ClientSpectatorEntity,
  playerShield: ClientPlayerShieldEntity,
};
