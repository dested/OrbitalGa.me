import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {ScoreEntity} from '@common/entities/scoreEntity';

export class ScoreActor extends ClientActor<ScoreEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Scenery;

  get drawX() {
    return this.entity.position.x;
  }
  get drawY() {
    return this.entity.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.save();
    context.font = '20px kenney_spaceregular';
    context.strokeStyle = '#f0f0f0';
    context.strokeText(this.entity.score.toString(), this.drawX, this.drawY);
    context.fillStyle = '#49d7b8';
    context.fillText(this.entity.score.toString(), this.drawX, this.drawY);
    context.restore();
  }
}
