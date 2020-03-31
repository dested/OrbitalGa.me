import {IClientSocket} from '../../client/src/clientSocket';
import {ClientGame} from '../../client/src/game/clientGame';
import {Utils} from '@common/utils/utils';

type Moving = 'left' | 'right' | 'up' | 'down';

export class BotClientGame extends ClientGame {
  constructor(
    options: {onDied: (me: ClientGame) => void; onDisconnect: (me: ClientGame) => void},
    socket: IClientSocket
  ) {
    super(options, socket);

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

    liveEntity.releaseDown();
    liveEntity.releaseLeft();
    liveEntity.releaseRight();
    liveEntity.releaseUp();
    liveEntity.releaseShoot();

    switch (this.moving) {
      case 'left':
        liveEntity.pressLeft();
        break;
      case 'right':
        liveEntity.pressRight();
        break;
      case 'up':
        liveEntity.pressUp();
        break;
      case 'down':
        liveEntity.pressDown();
        break;
    }

    if (this.shooting) {
      liveEntity.pressShoot();
    }
  }
}
