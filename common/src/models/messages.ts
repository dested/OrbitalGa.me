import {ShotExplosionModel} from '../entities/shotExplosionEntity';
import {EnemyShotModel} from '../entities/enemyShotEntity';
import {PlayerModel} from '../entities/playerEntity';
import {SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {WallModel} from '../entities/wallEntity';
import {ShotModel} from '../entities/shotEntity';
import {SpectatorModel} from '../entities/spectatorEntity';
import {PlayerShieldModel} from '../entities/playerShieldEntity';
import {WorldStateEntity} from './entityTypeModels';

export type ClientToServerMessage =
  | {
      type: 'join';
    }
  | {
      type: 'spectate';
    }
  | {
      down: boolean;
      inputSequenceNumber: number;
      left: boolean;
      right: boolean;
      shoot: boolean;
      type: 'playerInput';
      up: boolean;
    };

export type ServerToClientMessage =
  | ({
      serverVersion: number;
      type: 'joined';
    } & PlayerModel)
  | {
      serverVersion: number;
      type: 'spectating';
    }
  | {
      entities: WorldStateEntity[];
      type: 'worldState';
    };
