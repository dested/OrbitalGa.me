const screenSize = {width: 1950, height: 900};

export class GameDebug {
  static client = false;
  static clientServerView = false;
  static collisions = false;
  static dontFilterEntities = false;
  static noBackground = false;
  static noTimeout = false;
  static throttleClient = false;
}

export class GameConstants {
  static binaryTransport = true;
  static capOnServerSpectators = 200;
  static capOnServerUsers = 200;

  static isSinglePlayer = typeof window === 'object' && window.location.pathname.indexOf('single') >= 0;
  static lastActionTimeout = 120_000 * (GameDebug.noTimeout ? 100000 : 1);
  static lastPingTimeout = 30_000 * (GameDebug.noTimeout ? 100000 : 1);
  static noMessageDuration = 3_000 * (GameDebug.noTimeout ? 100000 : 1);
  static numberOfSinglePlayerBots = 0;
  static pingInterval = 3_000 * (GameDebug.noTimeout ? 100000 : 1);
  static playerStartingY = screenSize.height * 0.8;
  static screenRange = screenSize.width * 1.4;
  static screenSize = screenSize;
  static serverTickRate = 150;
  static serverVersion = 9;
  static totalSpectatorDuration = 30_000;
}
