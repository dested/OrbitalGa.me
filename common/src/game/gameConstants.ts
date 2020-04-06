export class GameConstants {
  static debugClient = false;
  static fullLocalServer = true;
  static debugDraw = false;
  static binaryTransport = true;
  static serverTickRate = 150;
  static screenSize = {width: 1500 * 1.3, height: 692 * 1.3};
  static screenRange = GameConstants.screenSize.width * 1.4;
  static throttleClient = false;
  static serverVersion = 4;
  static playerStartingY = GameConstants.screenSize.height * 0.8;
}
