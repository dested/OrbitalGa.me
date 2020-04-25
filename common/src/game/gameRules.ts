export const GameRules = {
  playerShield: {
    small: {maxHealth: 5, depletedRegenTimeout: 30, regenRate: 3},
    medium: {maxHealth: 10, depletedRegenTimeout: 30, regenRate: 3},
    big: {maxHealth: 15, depletedRegenTimeout: 30, regenRate: 3},
  },
  player: {
    base: {
      maxSideSpeed: 120,
      maxReverseSpeed: 100,
      maxForwardSpeed: 150,
      momentumDeceleration: 0.7,
      speedRamp: 50,
      startingHealth: 20,
    },
  },
  enemyShots: {
    base: {
      shotSpeedPerSecond: 900,
    },
  },
  enemies: {
    swoopingEnemy: {
      startingHealth: 7,
    },
  },
};

export type PlayerWeapon = 'rocket' | 'laser1' | 'laser2' | 'torpedo' | 'laser1Spray10';

export type WeaponConfig = {
  alternateSide: boolean;
  ammoType: 'infinite' | 'per-shot' | 'time';
  damage: number;
  explosionIntensity: number;
  maxAmmo: number;
  rampUp: boolean;
  resetShootTimer: number;
  speed: number;
  spray: number;
};

export const WeaponConfigs: {[key in PlayerWeapon]: WeaponConfig} = {
  rocket: {
    maxAmmo: 10,
    ammoType: 'per-shot',
    speed: 80,
    rampUp: true,
    damage: 5,
    explosionIntensity: 2,
    alternateSide: false,
    resetShootTimer: 5,
    spray: 0,
  },
  laser1: {
    maxAmmo: 0,
    ammoType: 'infinite',
    speed: 1000,
    rampUp: false,
    damage: 1,
    explosionIntensity: 1,
    alternateSide: true,
    resetShootTimer: 1,
    spray: 0,
  },
  laser1Spray10: {
    maxAmmo: 30_000,
    ammoType: 'time',
    speed: 700,
    rampUp: false,
    damage: 1,
    explosionIntensity: 1,
    alternateSide: false,
    resetShootTimer: 3,
    spray: 10,
  },
  laser2: {
    maxAmmo: 60_000,
    ammoType: 'time',
    speed: 1000,
    rampUp: false,
    damage: 2,
    explosionIntensity: 1,
    alternateSide: true,
    resetShootTimer: 1,
    spray: 0,
  },
  torpedo: {
    maxAmmo: 10,
    ammoType: 'per-shot',
    speed: 120,
    rampUp: true,
    damage: 8,
    explosionIntensity: 3,
    alternateSide: false,
    resetShootTimer: 7,
    spray: 0,
  },
};
