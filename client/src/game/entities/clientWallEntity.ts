import {WallEntity, WallModel} from '@common/entities/wallEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';

export class ClientWallEntity extends WallEntity implements ClientEntity {
  constructor(game: ClientGame, messageEntity: WallModel) {
    super(game, messageEntity.entityId, messageEntity.width, messageEntity.height);

    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.updatePosition();
  }

  zIndex = DrawZIndex.Scenery;
  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'white';
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}
