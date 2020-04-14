import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {MeteorEntity, MeteorModel} from '@common/entities/meteorEntity';
import {Utils} from '@common/utils/utils';
import {OrbitalAssets} from '../../utils/assetManager';
import {CanvasUtils} from '../../utils/canvasUtils';
import {AssetKeys} from '../../assets';
import {GameConstants} from '@common/game/gameConstants';
import {ShakeGame} from '../../utils/shakeUtils';

export class ClientMeteorEntity extends MeteorEntity implements ClientEntity {
  static _whiteMeteor: {[key in AssetKeys]?: HTMLCanvasElement} = {};
  hitTimer = 0;
  zIndex = DrawZIndex.Scenery;

  constructor(private clientGame: ClientGame, messageModel: MeteorModel) {
    super(
      clientGame,
      messageModel.entityId,
      messageModel.x,
      messageModel.y,
      messageModel.meteorColor,
      messageModel.size,
      messageModel.type
    );
  }

  get drawX() {
    return this.realX;
  }

  get drawY() {
    return this.realY;
  }

  draw(context: CanvasRenderingContext2D): void {
    const color = this.meteorColor === 'brown' ? 'Brown' : 'Grey';

    const asset = `Meteors.meteor${color}_${this.size}${this.type}` as 'Meteors.meteorBrown_big1';
    const meteor = OrbitalAssets.assets[asset];

    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.byteDegToRad(this.rotate));
    context.drawImage(meteor.image, -meteor.size.width / 2, -meteor.size.height / 2);

    if (this.hitTimer > 0) {
      context.save();
      context.globalAlpha = this.hitTimer / 100;
      context.drawImage(ClientMeteorEntity.whiteMeteor(asset), -meteor.size.width / 2, -meteor.size.height / 2);
      context.restore();
      this.hitTimer -= 3;
    }
    context.restore();
  }

  reconcileFromServer(messageModel: MeteorModel) {
    const wasHit = this.hit;
    super.reconcileFromServer(messageModel);
    if (this.hit !== wasHit) {
      // this.hitTimer = 90;
    }
  }

  tick() {}

  static whiteMeteor(asset: AssetKeys) {
    if (!this._whiteMeteor[asset]) {
      this._whiteMeteor[asset] = CanvasUtils.mask(OrbitalAssets.assets[asset], 255, 255, 255);
    }
    return this._whiteMeteor[asset]!;
  }
}
