export const GameRules = {
  playerShield: {
    base: {startingHealth: 10, depletedRegenTimeout: 30, regenRate: 3},
  },
  player: {
    base: {maxSpeed: 90, momentumDeceleration: 0.5, startingHealth: 50},
  },
  playerShots: {
    base: {
      shotSpeedPerSecond: 1000,
    },
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
