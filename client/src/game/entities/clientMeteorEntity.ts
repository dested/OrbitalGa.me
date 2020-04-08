import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {MeteorEntity, MeteorModel} from '@common/entities/meteorEntity';
import {AssetManager} from '../../utils/assetManager';

export class ClientMeteorEntity extends MeteorEntity implements ClientEntity {
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }

  constructor(game: ClientGame, messageEntity: MeteorModel) {
    super(game, messageEntity.entityId, messageEntity.meteorColor, messageEntity.size, messageEntity.type);

    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Scenery;
  draw(context: CanvasRenderingContext2D): void {
    const meteor = AssetManager.assets['meteor.brown.big.1'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(meteor.image, -meteor.size.width / 2, -meteor.size.height / 2);
    context.restore();
  }
}
