import {Utils} from '@common/utils/utils';
import {IClientSocket} from '../clientSocket';
import {ClientGame, ClientGameOptions} from './clientGame';

type Moving = 'left' | 'right' | 'up' | 'down';

export class BotClientGame extends ClientGame {
  isBot = true;
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
    liveEntity.setKey('weapon', 'laser1');

    liveEntity.setKey('down', false);
    liveEntity.setKey('left', false);
    liveEntity.setKey('right', false);
    liveEntity.setKey('up', false);
    liveEntity.setKey('shoot', false);

    switch (this.moving) {
      case 'left':
        liveEntity.setKey('left', true);
        break;
      case 'right':
        liveEntity.setKey('right', true);
        break;
      case 'up':
        liveEntity.setKey('up', true);
        break;
      case 'down':
        liveEntity.setKey('down', true);
        break;
    }

    if (this.shooting) {
      liveEntity.setKey('shoot', true);
    }
  }
}
