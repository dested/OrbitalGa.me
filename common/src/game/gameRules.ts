export const GameRules = {
  playerShield: {
    small: {maxHealth: 10, depletedRegenTimeout: 30, regenRate: 3},
    medium: {maxHealth: 20, depletedRegenTimeout: 30, regenRate: 3},
    big: {maxHealth: 30, depletedRegenTimeout: 30, regenRate: 3},
  },
  player: {
    base: {maxSpeed: 90, momentumDeceleration: 0.5, startingHealth: 50},
  },
  enemyShots: {
    base: {
      shotSpeedPerSecond: 900,
    },
  },
  enemies: {
    swoopingEnemy: {
      startingHealth: 10,
    },
  },
};

export type PlayerWeapon = 'rocket' | 'laser' | 'torpedo';
export const AllPlayerWeapons: PlayerWeapon[] = ['laser', 'rocket', 'torpedo'];

export type WeaponConfig = {
  alternateSide: boolean;
  damage: number;
  explosionIntensity: number;
  infinite: boolean;
  maxAmmo: number;
  rampUp: boolean;
  resetShootTimer: number;
  speed: number;
};

export const WeaponConfigs: {[key in PlayerWeapon]: WeaponConfig} = {
  rocket: {
    maxAmmo: 10,
    infinite: false,
    speed: 80,
    rampUp: true,
    damage: 5,
    explosionIntensity: 2,
    alternateSide: false,
    resetShootTimer: 5,
  },
  laser: {
    maxAmmo: 0,
    infinite: true,
    speed: 1000,
    rampUp: false,
    damage: 1,
    explosionIntensity: 1,
    alternateSide: true,
    resetShootTimer: 1,
  },
  torpedo: {
    maxAmmo: 10,
    infinite: false,
    speed: 120,
    rampUp: true,
    damage: 8,
    explosionIntensity: 3,
    alternateSide: false,
    resetShootTimer: 7,
  },
};
