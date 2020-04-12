import {ClientSpectatorEntity} from './clientSpectatorEntity';
import {EntityType, EntityModels} from '@common/models/entityTypeModels';
import {ClientExplosionEntity} from './clientExplosionEntity';
import {ClientPlayerShieldEntity} from './clientPlayerShieldEntity';
import {ClientSwoopingEnemyEntity} from './clientSwoopingEnemyEntity';
import {ClientPlayerWeapon} from './clientPlayerWeapon';
import {ClientWallEntity} from './clientWallEntity';
import {ClientGame} from '../clientGame';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientEnemyShotEntity} from './clientEnemyShotEntity';
import {ClientMeteorEntity} from './clientMeteorEntity';
import {ClientLivePlayerEntity} from './clientLivePlayerEntity';
import {ClientDropEntity} from './clientDropEntity';
import {ClientBossEvent1Entity} from './clientBossEvent1Entity';
import {ClientBossEvent1EnemyEntity} from './clientBossEvent1EnemyEntity';

export const ClientEntityTypes: {
  [key in EntityModels['entityType']]: new (
    game: ClientGame,
    messageModel: EntityType[key]['model']
  ) => EntityType[key]['entity'];
} = {
  player: ClientPlayerEntity,
  enemyShot: ClientEnemyShotEntity,
  playerWeapon: ClientPlayerWeapon,
  explosion: ClientExplosionEntity,
  swoopingEnemy: ClientSwoopingEnemyEntity,
  wall: ClientWallEntity,
  spectator: ClientSpectatorEntity,
  playerShield: ClientPlayerShieldEntity,
  meteor: ClientMeteorEntity,
  livePlayer: ClientLivePlayerEntity,
  drop: ClientDropEntity,
  bossEvent1: ClientBossEvent1Entity,
  bossEvent1Enemy: ClientBossEvent1EnemyEntity,
};
