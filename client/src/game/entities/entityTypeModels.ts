import {SpectatorActor} from './spectatorActor';
import {EntityType, EntityModels} from '@common/models/serverToClientMessages';
import {ExplosionActor} from './explosionActor';
import {PlayerShieldActor} from './playerShieldActor';
import {SwoopingEnemyActor} from './swoopingEnemyActor';
import {ClientPlayerWeaponActor} from './clientPlayerWeaponActor';
import {WallActor} from './wallActor';
import {PlayerActor} from './playerActor';
import {EnemyShotActor} from './enemyShotActor';
import {MeteorActor} from './meteorActor';
import {LivePlayerActor} from './livePlayerActor';
import {BossEvent1EnemyActor} from './bossEvent1EnemyActor';
import {ScoreActor} from './scoreActor';
import {OrbitalGame} from '@common/game/game';
import {ClientActor} from '@common/baseEntities/clientActor';
import {DropActor} from './dropActor';
import {BossEvent1Actor} from './bossEvent1Actor';
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
  player: PlayerActor,
  enemyShot: EnemyShotActor,
  playerWeapon: ClientPlayerWeaponActor,
  explosion: ExplosionActor,
  swoopingEnemy: SwoopingEnemyActor,
  wall: WallActor,
  spectator: SpectatorActor,
  playerShield: PlayerShieldActor,
  meteor: MeteorActor,
  livePlayer: LivePlayerActor,
  drop: DropActor,
  bossEvent1: BossEvent1Actor,
  bossEvent1Enemy: BossEvent1EnemyActor,
  score: ScoreActor,
};
