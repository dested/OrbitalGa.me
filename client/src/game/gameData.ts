import {GameView} from './gameView';

export class GameData {
  static instance = new GameData();

  view: GameView;

  private constructor() {
    this.view = new GameView(window.innerWidth, window.innerHeight);

    window.addEventListener(
      'resize',
      () => {
        this.view.setBounds(window.innerWidth, window.innerHeight);
      },
      true
    );
  }
}
