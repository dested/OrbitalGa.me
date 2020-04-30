const screenSize = {width: 1950, height: 900};

export class GameConstants {
  static binaryTransport = true;
  static capOnServerSpectators = 200;
  static capOnServerUsers = 200;
  static debugClient = true;
  static debugCollisions = false;
  static debugDontFilterEntities = false;
  static isSinglePlayer = typeof window === 'object' && window.location.pathname.indexOf('single') >= 0;
  static lastActionTimeout = 120_000;
  static lastPingTimeout = 30_000;
  static noMessageDuration = 3_000;
  static numberOfSinglePlayerBots = 0;
  static pingInterval = 3_000;
  static playerStartingY = screenSize.height * 0.8;
  static screenRange = screenSize.width * 1.4;
  static screenSize = screenSize;
  static serverTickRate = 150;
  static serverVersion = 9;
  static throttleClient = true;
  static totalSpectatorDuration = 30_000;
}
