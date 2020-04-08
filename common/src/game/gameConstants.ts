const screenSize = {width: 1500 * 1.3, height: 692 * 1.3};

export class GameConstants {
  static binaryTransport = true;
  static debugClient = false;
  static debugCollisions = false;
  static debugDontFilterEntities = false;
  static debugInvulnerable = false;
  static numberOfSinglePlayerBots = 0;
  static playerStartingY = screenSize.height * 0.8;
  static screenRange = screenSize.width * 1.4;
  static screenSize = screenSize;
  static serverTickRate = 150;
  static serverVersion = 6;

  static singlePlayer = typeof window === 'object' && window.location.pathname.indexOf('single') >= 0;
  static throttleClient = false;
}
