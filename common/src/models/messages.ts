export type ClientToServerMessage =
  | {
      type: 'join';
    }
  | {
      type: 'playerInput';
      pressTime: number;
      inputSequenceNumber: number;
      left: boolean;
      shoot: boolean;
      right: boolean;
      up: boolean;
      down: boolean;
    };

export type WorldStateEntity = {entityId: number; x: number; y: number} & (
  | {
      type: 'player';
      lastProcessedInputSequenceNumber: number;
    }
  | {
      type: 'swoopingEnemy';
      health: number;
    }
  | {
      type: 'wall';
      width: number;
      height: number;
    }
  | {
      type: 'shot';
      markToDestroy: boolean;
    }
  | {
      type: 'enemyShot';
      markToDestroy: boolean;
    }
);

export type ServerToClientCreateEntity = {
  type: 'createEntity';
  entityId: number;
  x: number;
  y: number;
} & ({entityType: 'shot'} | {entityType: 'enemyShot'} | {entityType: 'swoopingEnemy'; health: number});

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
