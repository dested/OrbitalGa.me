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

export type ServerToClientMessage =
  | {
      type: 'joined';
      clientId: string;
      entityId: string;
      x: number;
      y: number;
    }
  | ({
      type: 'createEntity';
      entityId: string;
      x: number;
      y: number;
    } & ({entityType: 'shot'} | {entityType: 'enemyShot'} | {entityType: 'swoopingEnemy'; health: number}))
  | {
      type: 'worldState';
      entities: ({entityId: string; x: number; y: number} & (
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
      ))[];
    };
