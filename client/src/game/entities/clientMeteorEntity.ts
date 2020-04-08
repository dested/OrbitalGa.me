import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {MeteorEntity, MeteorModel} from '@common/entities/meteorEntity';
import {AssetManager} from '../../utils/assetManager';
import {Utils} from '@common/utils/utils';

export class ClientMeteorEntity extends MeteorEntity implements ClientEntity {
  zIndex = DrawZIndex.Scenery;

  constructor(game: ClientGame, messageEntity: MeteorModel) {
    super(game, messageEntity.entityId, messageEntity.meteorColor, messageEntity.size, messageEntity.type);
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.updatePolygon();
  }
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }
  draw(context: CanvasRenderingContext2D): void {
    const meteor = AssetManager.assets[`meteor.${this.meteorColor}.${this.size}.${this.type}`];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.byteDegToRad(this.rotate));
    context.drawImage(meteor.image, -meteor.size.width / 2, -meteor.size.height / 2);
    context.restore();
  }

  tick() {}
}
