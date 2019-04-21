export enum ActionType {
  Left = 'left',
  Right = 'right',
  Up = 'up',
  Down = 'down',
  Shoot = 'shoot',
}

export type Action = {
  actionTick: number;
  entityId: string;
  x: number;
  y: number;
} & (
  | {
      actionType: ActionType.Down | ActionType.Left | ActionType.Up | ActionType.Right;
    }
  | {
      actionType: ActionType.Shoot;
      id: string;
    });

export interface WorldState {
  entities: SerializedEntity[];
  currentTick: number;
  resync: boolean;
}

export type EntityOptions = {id: string; x: number; y: number};
export type PlayerEntityOptions = EntityOptions & {
  type: 'player';
  color: string;
  lastDownAction: {[action in ActionType]?: Action};
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
