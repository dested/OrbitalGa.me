import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {Game} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';

export class LivePlayerEntity extends PlayerEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;
  constructor(private clientGame: ClientGame, public entityId: number) {
    super(clientGame, entityId);
  }

  positionLerp?: {startTime: number; duration: number; x: number; y: number};

  gameTick(): void {
    super.gameTick();
  }

  keys = {up: false, down: false, left: false, right: false, shoot: false};

  pressKey(input: keyof LivePlayerEntity['keys']) {
    this.keys[input] = true;
  }

  releaseKey(input: keyof LivePlayerEntity['keys']) {
    this.keys[input] = false;
  }

  get drawX(): number {
    if (!this.positionLerp) {
      return this.x;
    } else {
      const {x, y, startTime, duration} = this.positionLerp;
      const now = +new Date();
      if (now >= startTime + duration) {
        return this.x;
      } else {
        return Utils.lerp(x, this.x, (now - startTime) / duration);
      }
    }
  }

  get drawY(): number {
    if (!this.positionLerp) {
      return this.y;
    } else {
      const {x, y, startTime, duration} = this.positionLerp;
      const now = +new Date();
      if (now >= startTime + duration) {
        return this.y;
      } else {
        return Utils.lerp(y, this.y, (now - startTime) / duration);
      }
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    const ship = AssetManager.assets.ship1;
    context.drawImage(ship.image, this.drawX - ship.size.width / 2, this.drawY - ship.size.height / 2);
  }

  processInput(duration: number) {
    if (!this.positionLerp) {
      this.positionLerp = {
        x: this.x,
        y: this.y,
        startTime: +new Date(),
        duration,
      };
    } else {
      this.positionLerp.x = this.x;
      this.positionLerp.y = this.y;
      this.positionLerp.startTime = +new Date();
      this.positionLerp.duration = duration;
    }

    const input = {
      ...this.keys,
      inputSequenceNumber: this.inputSequenceNumber++,
    };

    this.pendingInputs.push(input);

    this.applyInput(input);

    if (this.keys.shoot || this.keys.left || this.keys.right || this.keys.up || this.keys.down) {
      this.clientGame.sendMessageToServer({type: 'playerInput', ...input});
    }
  }

  reconcileFromServer(messageEntity: PlayerModel) {
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.momentum.x = messageEntity.momentumX;
    this.momentum.y = messageEntity.momentumY;
    let spliceIndex = -1;
    for (let i = 0; i < this.pendingInputs.length; i++) {
      const input = this.pendingInputs[i];
      if (input.inputSequenceNumber <= messageEntity.lastProcessedInputSequenceNumber) {
        spliceIndex = i;
      } else {
        this.applyInput(input);
        this.updatedPositionFromMomentum();
      }
    }
    if (spliceIndex >= 0) {
      this.pendingInputs.splice(0, spliceIndex + 1);
    }
  }
}
