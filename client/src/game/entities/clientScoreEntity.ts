import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {ScoreEntity, ScoreModel} from '@common/entities/scoreEntity';

export class ClientScoreEntity extends ScoreEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  updateY: number = 0;
  zIndex = DrawZIndex.Scenery;

  constructor(game: ClientGame, messageModel: ScoreModel) {
    super(game, messageModel);
  }

  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY - this.updateY;
  }
  destroyClient(): void {}

  draw(context: CanvasRenderingContext2D): void {
    context.save();
    context.font = '20px kenney_spaceregular';
    context.strokeStyle = '#f0f0f0';
    context.strokeText(this.score.toString(), this.drawX, this.drawY);
    context.fillStyle = '#49d7b8';
    context.fillText(this.score.toString(), this.drawX, this.drawY);
    context.restore();
  }

  tick() {
    this.updateY += 2;
  }
}
