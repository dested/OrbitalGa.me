import {WallEntity, WallModel} from '@common/entities/wallEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';

export class ClientWallEntity extends WallEntity implements ClientEntity {
  zIndex = DrawZIndex.Scenery;

  constructor(game: ClientGame, messageModel: WallModel) {
    super(game, messageModel.entityId, messageModel.width, messageModel.height);

    this.x = messageModel.x;
    this.y = messageModel.y;
    this.updatePolygon();
  }
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }
  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'white';
    context.fillRect(this.drawX, this.drawY, this.width, this.height);
  }
  tick() {}
}
