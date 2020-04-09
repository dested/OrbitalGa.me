import {PlayerModel} from '../entities/playerEntity';
import {WorldModel} from './entityTypeModels';

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
      entities: WorldModel[];
      type: 'worldState';
    };
