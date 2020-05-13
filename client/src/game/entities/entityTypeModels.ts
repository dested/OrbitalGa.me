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
import {ClientActor} from '@common/baseEntities/clientActor';
import {DropActor} from './dropActor';
import {BossEvent1Actor} from './bossEvent1Actor';
import {ClientEngine} from '../clientEngine';

export const ActorEntityTypes: {
  [key in EntityModels['type']]: new (engine: ClientEngine, entity: EntityType[key]['entity']) => ClientActor<
    EntityType[key]['entity']
  >;
} = {
  player: PlayerActor,
  livePlayer: LivePlayerActor,
  enemyShot: EnemyShotActor,
  playerWeapon: ClientPlayerWeaponActor,
  explosion: ExplosionActor,
  swoopingEnemy: SwoopingEnemyActor,
  wall: WallActor,
  spectator: SpectatorActor,
  playerShield: PlayerShieldActor,
  meteor: MeteorActor,
  drop: DropActor,
  bossEvent1: BossEvent1Actor,
  bossEvent1Enemy: BossEvent1EnemyActor,
  score: ScoreActor,
};
