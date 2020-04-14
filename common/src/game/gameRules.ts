export const GameRules = {
  playerShield: {
    small: {maxHealth: 10, depletedRegenTimeout: 30, regenRate: 3},
    medium: {maxHealth: 20, depletedRegenTimeout: 30, regenRate: 3},
    big: {maxHealth: 30, depletedRegenTimeout: 30, regenRate: 3},
  },
  player: {
    base: {maxSideSpeed: 70, maxReverseSpeed: 45, maxForwardSpeed: 90, momentumDeceleration: 0.5, startingHealth: 50},
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

export type PlayerWeapon = 'rocket' | 'laser1' | 'laser2' | 'torpedo';
export const AllPlayerWeapons: PlayerWeapon[] = ['laser1', 'laser2', 'rocket', 'torpedo'];

export type WeaponConfig = {
  alternateSide: boolean;
  ammoType: 'infinite' | 'per-shot' | 'time';
  damage: number;
  explosionIntensity: number;
  maxAmmo: number;
  rampUp: boolean;
  resetShootTimer: number;
  speed: number;
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
  },
};
