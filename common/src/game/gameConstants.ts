export class GameConstants {
  static debugClient = false;
  static debugCollisions = false;
  static debugDontFilterEntities = false;
  static debugDraw = false;
  static debugInvulnerable = false;

  static singlePlayer = typeof window === 'object' && window.location.pathname.indexOf('single') >= 0;
  static binaryTransport = true;
  static serverTickRate = 150;
  static screenSize = {width: 1500 * 1.3, height: 692 * 1.3};
  static screenRange = GameConstants.screenSize.width * 1.4;
  static throttleClient = false;
  static serverVersion = 5;
  static playerStartingY = GameConstants.screenSize.height * 0.8;
  static numberOfSinglePlayerBots = 0;
}

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
/*     this.realX - collisionResult.overlap * collisionResult.overlap_x,
          this.realY - collisionResult.overlap * collisionResult.overlap_y
     */
