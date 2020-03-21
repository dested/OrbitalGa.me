export type Action = {
  actionTick: number;
  entityId: string;
  x: number;
  y: number;
} & {
  controls: {
    left: boolean;
    right: boolean;
    down: boolean;
    up: boolean;
    shoot: boolean;
  };
};

export type WorldState = {
  serverTick: number;
} & (
  | {
      resync: true;
      entities: SerializedEntity[];
    }
  | {
      resync: false;
      entities: LightSerializedEntity[];
    }
);

export type EntityOptions = {id: string; x: number; y: number; isClient: boolean};
export type LightEntityOptions = {id: string; x: number; y: number};

export type PlayerEntityOptions = EntityOptions & {
  type: 'player';
  color: string;
  bufferedActions: Action[];
  speedPerSecond: number;
  shotStrength: number;
  shootEveryTick: number;
  shotSpeedPerSecond: number;

  shipType: string;
};
export type LightPlayerEntityOptions = {
  type: 'player';
  bufferedActions: Action[];
};

export type ShotEntityOptions = EntityOptions & {
  type: 'shot';
  strength: number;
  tickCreated: number;
  ownerId?: string;
  shotSpeedPerSecond: number;
};

export type LightShotEntityOptions = {type: 'shot'};

export type EnemyEntityOptions = EntityOptions & {type: 'enemy'; health: number; color: string};
export type LightEnemyEntityOptions = {type: 'enemy'; health: number};

export type SerializedEntity = EntityOptions & (PlayerEntityOptions | ShotEntityOptions | EnemyEntityOptions);
export type LightSerializedEntity = LightEntityOptions &
  (LightPlayerEntityOptions | LightShotEntityOptions | LightEnemyEntityOptions);

