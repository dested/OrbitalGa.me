export const GameRules = {
  playerShield: {
    small: {maxHealth: 10, depletedRegenTimeout: 30, regenRate: 3},
    medium: {maxHealth: 20, depletedRegenTimeout: 30, regenRate: 3},
    big: {maxHealth: 30, depletedRegenTimeout: 30, regenRate: 3},
  },
  player: {
    base: {maxSpeed: 90, momentumDeceleration: 0.5, startingHealth: 50},
  },
  playerShots: {
    base: {
      shotSpeedPerSecond: 1000,
    },
  },
  playerRockets: {
    base: {
      rocketSpeedPerSecond: 200,
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
