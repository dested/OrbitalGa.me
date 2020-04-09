import {PlayerModel} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';

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
      entities: EntityModels[];
      type: 'worldState';
    };
