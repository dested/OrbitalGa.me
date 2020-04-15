import {LivePlayerModel} from '../entities/playerEntity';
import {EntityModels} from './entityTypeModels';
import {LeaderboardEntryRanked} from '../game/gameLeaderboard';
import {Size} from '../parsers/arrayBufferSchema';

export type ErrorMessage = {
  reason: 'nameInUse';
  type: 'error';
};

export type ServerToClientMessage =
  | ({
      serverVersion: number;
      type: 'joined';
    } & LivePlayerModel)
  | {
      serverVersion: number;
      type: 'spectating';
    }
  | {ping: number; type: 'pong'}
  | ErrorMessage
  | {
      entities: EntityModels[];
      type: 'worldState';
    }
  | {
      scores: LeaderboardEntryRanked[];
      type: 'leaderboard';
    };

export const ServerToClientSchema: Size<ServerToClientMessage[]> = {
  arraySize: 'uint16',
  typeLookup: true,
  pong: {
    type: 1,
    ping: 'uint8',
  },
  error: {
    type: 2,
    reason: {
      enum: true,
      nameInUse: 1,
    },
  },
  joined: {
    type: 3,
    entityType: 'string',
    serverVersion: 'uint8',
    x: 'float32',
    y: 'float32',
    entityId: 'uint32',
    health: 'uint8',
    playerColor: {
      enum: true,
      blue: 1,
      green: 2,
      orange: 3,
      red: 4,
    },
    create: 'boolean',
    availableWeapons: {
      arraySize: 'uint8',
      ammo: 'uint8',
      weapon: {
        enum: true,
        torpedo: 1,
        rocket: 2,
        laser1: 3,
        laser2: 4,
      },
    },
    dead: 'boolean',
    lastProcessedInputSequenceNumber: 'int32',
    momentumX: 'int32',
    momentumY: 'int32',
    selectedWeapon: {
      enum: true,
      laser2: 1,
      laser1: 2,
      rocket: 3,
      torpedo: 4,
    },
  },
  leaderboard: {
    type: 4,
    scores: {
      arraySize: 'uint16',
      aliveTime: 'uint32',
      calculatedScore: 'uint32',
      damageGiven: 'uint32',
      damageTaken: 'uint32',
      enemiesKilled: 'uint32',
      eventsParticipatedIn: 'uint32',
      shotsFired: 'uint32',
      userId: 'uint32',
      username: 'string',
      rank: 'uint16',
    },
  },
  spectating: {type: 5, serverVersion: 'uint8'},
  worldState: {
    type: 6,
    entities: {
      arraySize: 'uint16',
      entityTypeLookup: true,
      spectator: {
        entityType: 1,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
      },
      meteor: {
        entityType: 2,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        rotate: 'uint8',
        hit: 'boolean',
        size: {
          enum: true,
          big: 1,
          small: 2,
          tiny: 3,
          med: 4,
        },
        meteorColor: {
          enum: true,
          brown: 1,
          grey: 2,
        },
        meteorType: {
          enum: true,
          '1': 1,
          '2': 2,
          '3': 3,
          '4': 4,
        },
      },
      livePlayer: {
        entityType: 3,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        health: 'uint8',
        playerColor: {
          enum: true,
          blue: 1,
          green: 2,
          orange: 3,
          red: 4,
        },
        create: 'boolean',
        availableWeapons: {
          arraySize: 'uint8',
          ammo: 'uint16',
          weapon: {
            enum: true,
            torpedo: 1,
            rocket: 2,
            laser1: 3,
            laser2: 4,
          },
        },
        dead: 'boolean',
        lastProcessedInputSequenceNumber: 'uint32',
        momentumX: 'float32',
        momentumY: 'float32',
        selectedWeapon: {
          enum: true,
          laser2: 1,
          laser1: 2,
          rocket: 3,
          torpedo: 4,
        },
      },
      player: {
        entityType: 4,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        health: 'uint8',
        playerColor: {
          enum: true,
          blue: 1,
          green: 2,
          orange: 3,
          red: 4,
        },
        create: 'boolean',
        playerInputKeys: {
          bitmask: true,
          shoot: 0,
          right: 1,
          left: 2,
          up: 3,
          down: 4,
        },
      },
      drop: {
        entityType: 5,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        drop: {
          typeLookup: true,
          weapon: {
            type: 1,
            ammo: 'uint8',
            weapon: {
              enum: true,
              rocket: 1,
              laser2: 2,
              laser1: 3,
              torpedo: 4,
            },
          },
          health: {
            type: 2,
            amount: 'uint8',
          },
          shield: {
            type: 3,
            level: {
              enum: true,
              medium: 1,
              big: 2,
            },
          },
        },
      },
      wall: {
        entityType: 6,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        width: 'uint16',
        height: 'uint16',
      },
      swoopingEnemy: {
        entityType: 7,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        health: 'uint8',
        enemyColor: {
          enum: true,
          red: 1,
          green: 2,
          blue: 3,
          black: 4,
        },
      },
      playerShield: {
        entityType: 8,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        health: 'uint8',
        depleted: 'boolean',
        ownerEntityId: 'uint32',
        shieldStrength: {
          enum: true,
          small: 1,
          medium: 2,
          big: 3,
        },
      },
      explosion: {
        entityType: 9,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        intensity: 'uint8',
        ownerEntityId: 'int32Optional',
      },
      enemyShot: {
        entityType: 10,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
      },
      playerWeapon: {
        entityType: 11,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        weaponType: {
          enum: true,
          rocket: 1,
          laser1: 2,
          laser2: 3,
          torpedo: 4,
        },
        startY: 'int32',
        offsetX: 'int32',
        ownerEntityId: 'uint32',
      },
      bossEvent1: {
        entityType: 12,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        width: 'uint32',
        health: 'uint16',
      },
      bossEvent1Enemy: {
        entityType: 13,
        x: 'float32',
        y: 'float32',
        entityId: 'uint32',
        create: 'boolean',
        xOffset: 'int32',
        yOffset: 'int32',
        ownerEntityId: 'uint32',
        rotate: 'int32',
        pieceType: {
          enum: true,
          bodyBack1: 1,
          body1: 2,
          body2: 3,
          body3: 4,
          bodyBack2: 5,
          nose: 6,
        },
      },
    },
  },
};
