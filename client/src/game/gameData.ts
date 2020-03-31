import {GameView} from './gameView';
import {GameConstants} from '@common/game/gameConstants';

export class GameData {
  static instance = new GameData();

  view: GameView;

  private constructor() {
    this.view = new GameView(GameConstants.screenSize.width, GameConstants.screenSize.height);

    window.addEventListener(
      'resize',
      () => {
        this.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.height);
      },
      true
    );
  }
}
