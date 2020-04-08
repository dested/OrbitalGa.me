import {Utils} from '@common/utils/utils';
import {IClientSocket} from '../clientSocket';
import {ClientGame, ClientGameOptions} from './clientGame';

type Moving = 'left' | 'right' | 'up' | 'down';

export class BotClientGame extends ClientGame {
  moving: Moving = 'left';
  shooting: boolean = false;
  constructor(serverPath: string, options: ClientGameOptions, socket: IClientSocket) {
    super(serverPath, options, socket);

    const doAction = () => {
      setTimeout(() => {
        this.tryNextMoves();
        doAction();
      }, Math.random() * 200 + 50);
    };
    doAction();
  }
  private tryNextMoves() {
    const liveEntity = this.liveEntity;
    if (!liveEntity) {
      return;
    }

    const options: Moving[] = [];
    if (liveEntity.x > 0) {
      options.push('left');
    }
    if (liveEntity.x < 3000) {
      options.push('right');
    }
    if (liveEntity.y > 300) {
      options.push('up');
    }
    if (liveEntity.y < 1000) {
      options.push('down');
    }
    this.moving = Utils.randomElement(options);
    this.shooting = Utils.random(30);

    liveEntity.releaseKey('down');
    liveEntity.releaseKey('left');
    liveEntity.releaseKey('right');
    liveEntity.releaseKey('up');
    liveEntity.releaseKey('shoot');

    switch (this.moving) {
      case 'left':
        liveEntity.pressKey('left');
        break;
      case 'right':
        liveEntity.pressKey('right');
        break;
      case 'up':
        liveEntity.pressKey('up');
        break;
      case 'down':
        liveEntity.pressKey('down');
        break;
    }

    if (this.shooting) {
      liveEntity.pressKey('shoot');
    }
  }
}
