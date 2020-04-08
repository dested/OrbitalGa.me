import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {Game} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {ClientPlayerEntity} from './clientPlayerEntity';

export class ClientLivePlayerEntity extends ClientPlayerEntity implements ClientEntity {
  keys = {up: false, down: false, left: false, right: false, shoot: false};

  positionLerp?: {duration: number; startTime: number; x: number; y: number};
  zIndex = DrawZIndex.Player;
  constructor(private clientGame: ClientGame, public messageEntity: PlayerModel) {
    super(clientGame, messageEntity);
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

  gameTick(): void {
    super.gameTick();
  }
  interpolateEntity(renderTimestamp: number) {
    // live entity does not need to interpolate anything
  }

  pressKey(input: keyof ClientLivePlayerEntity['keys']) {
    this.keys[input] = true;
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
      this.clientGame.sendInput(input);
    }
  }

  reconcileFromServer(messageEntity: PlayerModel) {
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    super.reconcileDataFromServer(messageEntity);
    if (this.dead) {
      this.clientGame.died();
    }
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

  releaseKey(input: keyof ClientLivePlayerEntity['keys']) {
    this.keys[input] = false;
  }
  tick() {}
}
