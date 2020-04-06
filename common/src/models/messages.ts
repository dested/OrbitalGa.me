import {ShotExplosionModel} from '../entities/shotExplosionEntity';
import {EnemyShotModel} from '../entities/enemyShotEntity';
import {PlayerModel} from '../entities/playerEntity';
import {SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {WallModel} from '../entities/wallEntity';
import {ShotModel} from '../entities/shotEntity';
import {SpectatorModel} from '../entities/spectatorEntity';

export type ClientToServerMessage =
  | {
      type: 'join';
    }
  | {
      type: 'spectate';
    }
  | {
      type: 'playerInput';
      inputSequenceNumber: number;
      left: boolean;
      shoot: boolean;
      right: boolean;
      up: boolean;
      down: boolean;
    };

export type WorldStateEntity =
  | PlayerModel
  | SpectatorModel
  | SwoopingEnemyModel
  | WallModel
  | ShotModel
  | ShotExplosionModel
  | EnemyShotModel;

export type ServerToClientMessage =
  | {
      type: 'joined';
      entityId: number;
      x: number;
      y: number;
      serverVersion: number;
    }
  | {
      type: 'spectating';
      serverVersion: number;
    }
  | {
      type: 'worldState';
      entities: WorldStateEntity[];
    };
