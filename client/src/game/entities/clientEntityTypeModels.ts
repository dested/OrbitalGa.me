import {ClientSpectatorActor} from './clientSpectatorActor';
import {EntityType, EntityModels} from '@common/models/serverToClientMessages';
import {ClientExplosionActor} from './clientExplosionActor';
import {ClientPlayerShieldActor} from './clientPlayerShieldActor';
import {ClientSwoopingEnemyActor} from './clientSwoopingEnemyActor';
import {ClientPlayerWeaponActor} from './clientPlayerWeaponActor';
import {ClientWallActor} from './clientWallActor';

import {ClientPlayerActor} from './clientPlayerActor';
import {ClientEnemyShotActor} from './clientEnemyShotActor';
import {ClientMeteorActor} from './clientMeteorActor';
import {ClientLivePlayerActor} from './clientLivePlayerActor';
import {ClientBossEvent1EnemyActor} from './clientBossEvent1EnemyActor';
import {ClientScoreActor} from './clientScoreActor';
import {OrbitalGame} from '@common/game/game';
import {ClientActor} from '@common/baseEntities/clientActor';
import {ClientDropActor} from './clientDropActor';
import {ClientBossEvent1Actor} from './clientBossEvent1Actor';
import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {BossEvent1Entity} from '@common/entities/bossEvent1Entity';
import {ScoreEntity} from '@common/entities/scoreEntity';
import {PlayerWeaponEntity} from '@common/entities/playerWeaponEntity';
import {PlayerShieldEntity} from '@common/entities/playerShieldEntity';
import {DropEntity} from '@common/entities/dropEntity';
import {WallEntity} from '@common/entities/wallEntity';
import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {PlayerEntity} from '@common/entities/playerEntity';
import {BossEvent1EnemyEntity} from '@common/entities/bossEvent1EnemyEntity';
import {ExplosionEntity} from '@common/entities/explosionEntity';
import {MeteorEntity} from '@common/entities/meteorEntity';
import {EnemyShotEntity} from '@common/entities/enemyShotEntity';

export const ActorEntityTypes: {
  [key in EntityModels['type']]: new (entity: EntityType[key]['entity']) => ClientActor<EntityType[key]['entity']>;
} = {
  player: ClientPlayerActor,
  enemyShot: ClientEnemyShotActor,
  playerWeapon: ClientPlayerWeaponActor,
  explosion: ClientExplosionActor,
  swoopingEnemy: ClientSwoopingEnemyActor,
  wall: ClientWallActor,
  spectator: ClientSpectatorActor,
  playerShield: ClientPlayerShieldActor,
  meteor: ClientMeteorActor,
  livePlayer: ClientLivePlayerActor,
  drop: ClientDropActor,
  bossEvent1: ClientBossEvent1Actor,
  bossEvent1Enemy: ClientBossEvent1EnemyActor,
  score: ClientScoreActor,
};

export const EntityTypes: {
  [key in EntityModels['type']]: new (
    game: OrbitalGame,
    messageModel: EntityType[key]['model']
  ) => EntityType[key]['entity'];
} = {
  player: PlayerEntity,
  enemyShot: EnemyShotEntity,
  playerWeapon: PlayerWeaponEntity,
  explosion: ExplosionEntity,
  swoopingEnemy: SwoopingEnemyEntity,
  wall: WallEntity,
  spectator: SpectatorEntity,
  playerShield: PlayerShieldEntity,
  meteor: MeteorEntity,
  livePlayer: PlayerEntity,
  drop: DropEntity,
  bossEvent1: BossEvent1Entity,
  bossEvent1Enemy: BossEvent1EnemyEntity,
  score: ScoreEntity,
};
