import {ClientGame} from '../../client/clientGame';
import {Utils} from '../../utils/utils';
import {Game} from '../game';
import {PlayerEntityOptions} from '../types';
import {PlayerEntity} from './playerEntity';
import {ShotEntity} from './shotEntity';

export class LivePlayerEntity extends PlayerEntity {
  private lastSendActionTime: number = 0;
  constructor(game: ClientGame, options: PlayerEntityOptions) {
    super(game, options);
    this.serverX = this.x;
    this.serverY = this.y;
  }

  serverX: number;
  serverY: number;

  game: ClientGame;

  pressingLeft = false;
  pressingRight = false;

  pressingShoot = false;

  pressingUp = false;
  pressingDown = false;

  pressLeft() {
    if (this.pressingRight) {
      return;
    }
    this.pressingLeft = true;
  }

  pressRight() {
    if (this.pressingLeft) {
      return;
    }
    this.pressingRight = true;
  }

  releaseLeft() {
    this.pressingLeft = false;
  }

  releaseRight() {
    this.pressingRight = false;
  }

  pressUp() {
    if (this.pressingDown) {
      return;
    }
    this.pressingUp = true;
  }

  pressDown() {
    if (this.pressingUp) {
      return;
    }
    this.pressingDown = true;
  }

  releaseUp() {
    this.pressingUp = false;
  }

  releaseDown() {
    this.pressingDown = false;
  }

  pressShoot() {
    this.pressingShoot = true;
  }

  releaseShoot() {
    this.pressingShoot = false;
  }

  tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number) {
    const [actionSub2, actionSub1] = this.bufferedActions.slice(-2);
    if (!actionSub1) {
      return;
    }
    this.x = actionSub2.x + (actionSub1.x - actionSub2.x) * ((+new Date() - this.lastSendActionTime) / Game.tickRate);
    this.y = actionSub2.y + (actionSub1.y - actionSub2.y) * ((+new Date() - this.lastSendActionTime) / Game.tickRate);
  }

  lockTick(currentServerTick: number): void {
    const controls = {
      left: false,
      right: false,
      down: false,
      up: false,
      shoot: false,
    };

    if (this.pressingLeft) {
      controls.left = true;
    }
    if (this.pressingRight) {
      controls.right = true;
    }
    if (this.pressingUp) {
      controls.up = true;
    }
    if (this.pressingDown) {
      controls.down = true;
    }
    if (this.pressingShoot) {
      controls.shoot = true;
    }

    const action = {
      controls,
      x: this.serverX,
      y: this.serverY,
      entityId: this.id,
      actionTick: currentServerTick,
    };
    this.game.sendAction({...action});
    this.processAction(action);
    this.addAction(action);
    if (controls.left || controls.right || controls.up || controls.down) {
      this.game.collisionEngine.update();
      this.updatePolygon();
      this.checkCollisions(true);
      this.serverX = action.x;
      this.serverY = action.y;
    }
    this.lastSendActionTime = +new Date();
  }
}
