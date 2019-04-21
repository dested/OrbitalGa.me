export enum ActionType {
  Left = 'left',
  Right = 'right',
  Up = 'up',
  Down = 'down',
  Shoot = 'shoot',
  Bomb = 'bomb',
}

export enum ActionSubType {
  Other = 'other',
  Up = 'up',
  Down = 'down',
}

export interface Action {
  actionType: ActionType;
  actionSubType: ActionSubType;
  actionTick: number;
  entityId: string;
  x: number;
  y: number;
}

export interface WorldState {
  entities: SerializedEntity[];
  currentTick: number;
  resync: boolean;
}

export type EntityOptions = {id: string; x: number; y: number};
export type PlayerEntityOptions = EntityOptions & {
  type: 'player';
  color: string;
  lastDownAction: {[action: string]: Action};
  speedPerSecond: number;
  shotStrength: number;
  shootEveryTick: number;
  shotSpeedPerSecond: number;
};
export type ShotEntityOptions = EntityOptions & {
  type: 'shot';
  strength: number;
  tickCreated: number;
  ownerId?: string;
  initialY: number;
  shotSpeedPerSecond: number;
};
export type EnemyEntityOptions = EntityOptions & {type: 'enemy'; health: number; color: string};

export type SerializedEntity = EntityOptions & (PlayerEntityOptions | ShotEntityOptions | EnemyEntityOptions);

export type ServerMessage =
  | {
      messageType: 'start';
      state: WorldState;
      yourEntityId: string;
      serverTick: number;
    }
  | {
      messageType: 'action';
      action: Action;
    }
  | {
      messageType: 'worldState';
      state: WorldState;
    };
