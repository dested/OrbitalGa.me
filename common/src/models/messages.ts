import {ShotExplosionModel} from '../entities/shotExplosionEntity';
import {EnemyShotModel} from '../entities/enemyShotEntity';
import {PlayerModel} from '../entities/playerEntity';
import {SwoopingEnemyModel} from '../entities/swoopingEnemyEntity';
import {WallModel} from '../entities/wallEntity';
import {ShotModel} from '../entities/shotEntity';

export type ClientToServerMessage =
  | {
      type: 'join';
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
  | SwoopingEnemyModel
  | WallModel
  | ShotModel
  | ShotExplosionModel
  | EnemyShotModel;

export type ServerToClientCreateEntity = {
  type: 'createEntity';
} & WorldStateEntity;

export type ServerToClientMessage =
  | {
      type: 'joined';
      clientId: string;
      entityId: number;
      x: number;
      y: number;
    }
  | ServerToClientCreateEntity
  | {
      type: 'worldState';
      entities: WorldStateEntity[];
    };
