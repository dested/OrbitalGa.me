import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {MeteorEntity, MeteorModel} from '@common/entities/meteorEntity';
import {Utils} from '@common/utils/utils';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientMeteorEntity extends MeteorEntity implements ClientEntity {
  zIndex = DrawZIndex.Scenery;

  constructor(game: ClientGame, messageModel: MeteorModel) {
    super(game, messageModel.entityId, messageModel.meteorColor, messageModel.size, messageModel.type);
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
    const color = this.meteorColor === 'brown' ? 'Brown' : 'Grey';

    const meteor =
      OrbitalAssets.assets[`Meteors.meteor${color}_${this.size}${this.type}` as 'Meteors.meteorBrown_big1'];

    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.byteDegToRad(this.rotate));
    context.drawImage(meteor.image, -meteor.size.width / 2, -meteor.size.height / 2);
    context.restore();
  }

  tick() {}
}
