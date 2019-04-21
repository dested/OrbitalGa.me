import {ClientGame} from '../../client/clientGame';
import {Utils} from '../../utils/utils';
import {ActionType, PlayerEntityOptions} from '../types';
import {PlayerEntity} from './playerEntity';
import {ShotEntity} from './shotEntity';

export class LivePlayerEntity extends PlayerEntity {
  constructor(game: ClientGame, options: PlayerEntityOptions) {
    super(game, options);
  }

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

  lockPressingShoot = false;
  lockPressingLeft = false;
  lockPressingRight = false;
  lockPressingUp = false;
  lockPressingDown = false;

  tick(timeSinceLastTick: number, currentServerTick: number) {
    if (this.lockPressingLeft) {
      this.x -= (timeSinceLastTick / 1000) * this.speedPerSecond;
    }
    if (this.lockPressingRight) {
      this.x += (timeSinceLastTick / 1000) * this.speedPerSecond;
    }

    if (this.lockPressingUp) {
      this.y -= (timeSinceLastTick / 1000) * this.speedPerSecond;
    }
    if (this.lockPressingDown) {
      this.y += (timeSinceLastTick / 1000) * this.speedPerSecond;
    }
  }

  lockTick(currentServerTick: number): void {
    if (this.pressingShoot) {
      const id = Utils.generateId();
      this.game.sendAction({
        actionType: ActionType.Shoot,
        x: this.x,
        y: this.y,
        entityId: id,
        actionTick: currentServerTick,
      });

      const shotEntity = new ShotEntity(this.game, {
        tickCreated: currentServerTick,
        x: this.x,
        y: this.y,
        ownerId: this.id,
        strength: this.shotStrength,
        id,
        type: 'shot',
        shotSpeedPerSecond: this.shotSpeedPerSecond,
      });
      this.game.addEntity(shotEntity);
    }

    if (this.pressingLeft) {
      this.game.sendAction({
        actionType: ActionType.Left,
        x: this.x,
        y: this.y,
        entityId: this.id,
        actionTick: currentServerTick,
      });
    }
    if (this.pressingRight) {
      this.game.sendAction({
        actionType: ActionType.Right,
        x: this.x,
        y: this.y,
        entityId: this.id,
        actionTick: currentServerTick,
      });
    }

    if (this.pressingUp) {
      this.game.sendAction({
        actionType: ActionType.Up,
        x: this.x,
        y: this.y,
        entityId: this.id,
        actionTick: currentServerTick,
      });
    }
    if (this.pressingDown) {
      this.game.sendAction({
        actionType: ActionType.Down,
        x: this.x,
        y: this.y,
        entityId: this.id,
        actionTick: currentServerTick,
      });
    }

    this.lockPressingShoot = this.pressingShoot;
    this.lockPressingLeft = this.pressingLeft;
    this.lockPressingRight = this.pressingRight;
    this.lockPressingUp = this.pressingUp;
    this.lockPressingDown = this.pressingDown;
  }
}
