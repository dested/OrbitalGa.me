import {WallEntity} from '@common/entities/wallEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';

export class ClientWallEntity extends WallEntity implements ClientEntity {
  zIndex = DrawZIndex.Scenery;
  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'white';
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}
