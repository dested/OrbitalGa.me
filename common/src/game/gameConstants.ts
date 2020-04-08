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
