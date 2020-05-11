import {Utils} from '@common/utils/utils';
import {IClientSocket} from '../socket/IClientSocket';
import {ClientEngine, ClientGameOptions} from './clientEngine';
import {Game} from '@common/game/game';

type Moving = 'left' | 'right' | 'up' | 'down';

export class BotClientEngine extends ClientEngine {
  isBot = true;
  moving: Moving = 'left';
  shooting: boolean = false;
  constructor(serverPath: string, options: ClientGameOptions, socket: IClientSocket, game: Game) {
    super(serverPath, options, socket, game);

    const doAction = () => {
      setTimeout(() => {
        this.tryNextMoves();
        doAction();
      }, Math.random() * 200 + 50);
    };
    doAction();
  }
  postTick(tickIndex: number, duration: number): void {}
  private tryNextMoves() {
    const liveEntity = this.game.clientPlayer;
    if (!liveEntity) {
      return;
    }

    const options: Moving[] = [];
    options.push('left');
    options.push('right');
    options.push('up');
    options.push('down');

    this.moving = Utils.randomElement(options);
    this.shooting = Utils.random(30);
    // this.setKey('weapon', 'laser1'); //todo weapon

    this.setKey('down', false);
    this.setKey('left', false);
    this.setKey('right', false);
    this.setKey('up', false);
    this.setKey('shoot', false);

    switch (this.moving) {
      case 'left':
        this.setKey('left', true);
        break;
      case 'right':
        this.setKey('right', true);
        break;
      case 'up':
        this.setKey('up', true);
        break;
      case 'down':
        this.setKey('down', true);
        break;
    }

    if (this.shooting) {
      this.setKey('shoot', true);
    }
  }
}
