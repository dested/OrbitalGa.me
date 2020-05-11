import {LivePlayerModel, PlayerInput, PlayerModel} from '@common/entities/playerEntity';
import {assertType} from '@common/utils/utils';
import {DrawZIndex} from '@common/baseEntities/clientActor';
import {PlayerActor} from './playerActor';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';
import {OrbitalGame} from '@common/game/game';

type KeyInput = Omit<PlayerInput, 'inputSequenceNumber'>;

export class LivePlayerActor extends PlayerActor {
  clientDestroyedTick?: number = undefined;
  inputSequenceNumber: number = 1;
  keys: KeyInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    weapon: 'unset',
  };

  mainTick = 0;
  zIndex = DrawZIndex.Player;

  get drawX(): number {
    return this.entity.position.x;
  }

  get drawY(): number {
    return this.entity.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    if (GameDebug.client) {
      context.save();
      context.font = '20px kenney_spaceregular';
      context.strokeStyle = '#f0f0f0';
      context.strokeText(this.entity.playersToLeft.toString(), this.drawX - 100, this.drawY);
      context.fillStyle = '#49d7b8';
      context.fillText(this.entity.playersToLeft.toString(), this.drawX - 100, this.drawY);

      context.strokeStyle = '#f0f0f0';
      context.strokeText(this.entity.playersToRight.toString(), this.drawX + 100, this.drawY);
      context.fillStyle = '#49d7b8';
      context.fillText(this.entity.playersToRight.toString(), this.drawX + 100, this.drawY);

      context.restore();
    }
  }

  /*
  todo
  reconcileFromServer(messageModel: LivePlayerModel | PlayerModel) {
    assertType<LivePlayerModel>(messageModel);
    const wasHit = this.hit;
    super.reconcileFromServerLive(messageModel);

    if (this.hit !== wasHit) {
      this.hitTimer = 5;
    }

    if (this.dead) {
      this.clientGame.died();
    }
  }*/

  staticDraw(context: CanvasRenderingContext2D) {
    const totalCount = this.entity.game.totalPlayers;
    if (this.entity.playersToLeft > this.entity.playersToRight && this.entity.playersToLeft > totalCount * 0.6) {
      const dx = GameConstants.screenSize.width * 0.1 + Math.cos(this.mainTick / 10) * 50;
      context.drawImage(
        OrbitalAssets.assets['Arrows.arrowLeft'].image,
        dx,
        GameConstants.screenSize.height * 0.5,
        GameConstants.screenSize.height * 0.15,
        GameConstants.screenSize.height * 0.15
      );
    }
    if (this.entity.playersToRight > this.entity.playersToLeft && this.entity.playersToRight > totalCount * 0.6) {
      const dx = GameConstants.screenSize.width * 0.9 - +Math.cos(this.mainTick / 10) * 50;
      context.drawImage(
        OrbitalAssets.assets['Arrows.arrowRight'].image,
        dx,
        GameConstants.screenSize.height * 0.5,
        GameConstants.screenSize.height * 0.15,
        GameConstants.screenSize.height * 0.15
      );
    }
  }
  tick() {
    this.mainTick++;
  }
}
