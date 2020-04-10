import {ClientSpectatorEntity} from './clientSpectatorEntity';
import {EntityType, EntityModels} from '@common/models/entityTypeModels';
import {ClientExplosionEntity} from './clientExplosionEntity';
import {ClientPlayerShieldEntity} from './clientPlayerShieldEntity';
import {ClientSwoopingEnemyEntity} from './clientSwoopingEnemyEntity';
import {ClientShotEntity} from './clientShotEntity';
import {ClientWallEntity} from './clientWallEntity';
import {ClientGame} from '../clientGame';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientEnemyShotEntity} from './clientEnemyShotEntity';
import {ClientMeteorEntity} from './clientMeteorEntity';
import {ClientRocketEntity} from './clientRocketEntity';
import {ClientLivePlayerEntity} from './clientLivePlayerEntity';

export const ClientEntityTypes: {
  [key in EntityModels['entityType']]: new (
    game: ClientGame,
    messageModel: EntityType[key]['model']
  ) => EntityType[key]['entity'];
} = {
  player: ClientPlayerEntity,
  enemyShot: ClientEnemyShotEntity,
  shot: ClientShotEntity,
  explosion: ClientExplosionEntity,
  swoopingEnemy: ClientSwoopingEnemyEntity,
  wall: ClientWallEntity,
  spectator: ClientSpectatorEntity,
  playerShield: ClientPlayerShieldEntity,
  meteor: ClientMeteorEntity,
  rocket: ClientRocketEntity,
  livePlayer: ClientLivePlayerEntity,
};
