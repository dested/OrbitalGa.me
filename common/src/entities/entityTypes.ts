import {EntityModels, EntityType} from '../models/serverToClientMessages';
import {OrbitalGame} from '../game/game';
import {PlayerEntity} from './playerEntity';
import {EnemyShotEntity} from './enemyShotEntity';
import {PlayerWeaponEntity} from './playerWeaponEntity';
import {ExplosionEntity} from './explosionEntity';
import {SwoopingEnemyEntity} from './swoopingEnemyEntity';
import {WallEntity} from './wallEntity';
import {SpectatorEntity} from './spectatorEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {MeteorEntity} from './meteorEntity';
import {DropEntity} from './dropEntity';
import {BossEvent1Entity} from './bossEvent1Entity';
import {BossEvent1EnemyEntity} from './bossEvent1EnemyEntity';
import {ScoreEntity} from './scoreEntity';

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
