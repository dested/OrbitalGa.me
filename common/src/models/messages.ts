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

export type WorldStateEntity = {entityId: number; x: number; y: number; realX?: number; realY?: number} & (
  | {
      type: 'player';
      lastProcessedInputSequenceNumber: number;
      momentumX: number;
      momentumY: number;
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
      ownerEntityId: number;
      shotOffsetX: number;
      shotOffsetY: number;
    }
  | {
      type: 'shotExplosion';
      aliveDuration: number;
      ownerEntityId: number;
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
} & (
  | {entityType: 'shot'; ownerEntityId: number; shotOffsetX: number; shotOffsetY: number}
  | {entityType: 'shotExplosion'; aliveDuration: number; ownerEntityId: number}
  | {entityType: 'enemyShot'}
  | {entityType: 'swoopingEnemy'; health: number}
);

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
