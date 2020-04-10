import {PlayerInput, PlayerModel} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';

export type ClientToServerMessage =
  | {
      type: 'join';
    }
  | {
      type: 'spectate';
    }
  | {
      type: 'ping';
    }
  | ({
      type: 'playerInput';
    } & PlayerInput);

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
