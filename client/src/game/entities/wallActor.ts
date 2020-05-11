import {WallEntity, WallModel} from '@common/entities/wallEntity';
import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';
import {OrbitalGame} from '@common/game/game';

export class WallActor extends ClientActor<WallEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Scenery;

  get drawX() {
    return this.entity.position.x;
  }
  get drawY() {
    return this.entity.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'white';
    context.fillRect(this.drawX, this.drawY, this.entity.width, this.entity.height);
  }
  tick() {}
}
