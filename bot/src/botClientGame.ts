import {Utils} from '@common/utils/utils';
import {IClientSocket} from '../../client/src/clientSocket';
import {ClientGame} from '../../client/src/game/clientGame';

type Moving = 'left' | 'right' | 'up' | 'down';

export class BotClientGame extends ClientGame {
  constructor(
    serverPath: string,
    options: {onDied: (me: ClientGame) => void; onDisconnect: (me: ClientGame) => void},
    socket: IClientSocket
  ) {
    super(serverPath, options, socket);

    const doAction = () => {
      setTimeout(() => {
        this.tryNextMoves();
        doAction();
      }, Math.random() * 200 + 50);
    };
    doAction();
  }

  moving: Moving = 'left';
  shooting: boolean = false;
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
