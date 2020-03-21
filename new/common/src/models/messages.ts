import {Action, WorldState} from '../game/types';

export type ClientToServerMessage =
  | {
      type: 'action';
      action: Action;
    }
  | {
      type: 'join';
    };

export type ServerToClientMessage =
  | {
      type: 'start';
      state: WorldState;
      yourEntityId: string;
      serverTick: number;
    }
  | {
      type: 'action';
      action: Action;
    }
  | {
      type: 'none';
    }
  | {
      type: 'worldState';
      state: WorldState;
    };
