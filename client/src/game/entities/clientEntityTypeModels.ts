import {ClientSpectatorEntity} from './clientSpectatorEntity';
import {Entity} from '@common/entities/entity';
import {EntityModelType, WorldModel} from '@common/models/entityTypeModels';
import {ClientShotExplosionEntity} from './clientShotExplosionEntity';
import {ClientPlayerShieldEntity} from './clientPlayerShieldEntity';
import {ClientSwoopingEnemyEntity} from './clientSwoopingEnemyEntity';
import {ClientShotEntity} from './clientShotEntity';
import {ClientWallEntity} from './clientWallEntity';
import {ClientGame} from '../clientGame';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientEnemyShotEntity} from './clientEnemyShotEntity';
import {ClientMeteorEntity} from './clientMeteorEntity';
import {ClientRocketEntity} from './clientRocketEntity';

export const ClientEntityTypes: {
  [key in WorldModel['entityType']]: new (game: ClientGame, messageEntity: EntityModelType[key]) => Entity;
} = {
  player: ClientPlayerEntity,
  enemyShot: ClientEnemyShotEntity,
  shot: ClientShotEntity,
  shotExplosion: ClientShotExplosionEntity,
  swoopingEnemy: ClientSwoopingEnemyEntity,
  wall: ClientWallEntity,
  spectator: ClientSpectatorEntity,
  playerShield: ClientPlayerShieldEntity,
  meteor: ClientMeteorEntity,
  rocket: ClientRocketEntity,
};
