const screenSize = {width: 1950, height: 900};

export class GameDebug {
  static autoSignIn = false;
  static client = true;
  static clientServerView = false;
  static collisions = false;
  static dontFilterEntities = false;
  static isLocal = true;
  static meteorCluster = false;
  static noBackground = false;
  static noEnemies = false;
  static noTimeout = false;
  static throttleClient = false;
  static renderServer = false;
}

export class GameConstants {
  static binaryTransport = true;
  static capOnServerSpectators = 200;
  static capOnServerUsers = 200;
  static gameStepRate = 60;

  static isSinglePlayer = typeof window === 'object' && window.location.pathname.indexOf('single') >= 0;
  static lastActionTimeout = 120_000 * (GameDebug.noTimeout ? 100_000_000 : 1);
  static lastPingTimeout = 30_000 * (GameDebug.noTimeout ? 100_000_000 : 1);
  static noMessageDuration = 3_000 * (GameDebug.noTimeout ? 100_000_000 : 1);
  static numberOfSinglePlayerBots = 0;
  static pingInterval = 3_000 * (GameDebug.noTimeout ? 100_000_000 : 100_000_000);
  static playerStartingY = screenSize.height * 0.8;
  static screenRange = screenSize.width * 1.4;
  static screenSize = screenSize;
  static serverTickRate = 1000 / 60;
  static serverVersion = 9;
  static totalSpectatorDuration = 30_000;
}
