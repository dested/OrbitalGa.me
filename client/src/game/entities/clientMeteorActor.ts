import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {MeteorEntity, MeteorModel} from '@common/entities/meteorEntity';
import {Utils} from '@common/utils/utils';
import {OrbitalAssets} from '../../utils/assetManager';
import {CanvasUtils} from '../../utils/canvasUtils';
import {AssetKeys} from '../../assets';

export class ClientMeteorActor extends ClientActor<MeteorEntity> {
  static _whiteMeteor: {[key in AssetKeys]?: HTMLCanvasElement} = {};
  clientDestroyedTick?: number = undefined;
  hitTimer = 0;
  zIndex = DrawZIndex.Scenery;

  get drawX() {
    return this.entity.position.x;
  }

  get drawY() {
    return this.entity.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    const color = this.entity.meteorColor === 'brown' ? 'Brown' : 'Grey';

    const asset = `Meteors.meteor${color}_${this.entity.size}${this.entity.meteorType}` as 'Meteors.meteorBrown_big1';
    const meteor = OrbitalAssets.assets[asset];

    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.byteDegToRad(this.entity.rotate));
    context.drawImage(meteor.image, -meteor.size.width / 2, -meteor.size.height / 2);

    if (this.hitTimer > 0) {
      context.save();
      context.globalAlpha = this.hitTimer / 5;
      context.drawImage(ClientMeteorActor.whiteMeteor(asset), -meteor.size.width / 2, -meteor.size.height / 2);
      context.restore();
      this.hitTimer -= 1;
    }
    context.restore();
  }

  /*
todo
  reconcileFromServer(messageModel: MeteorModel) {
    const wasHit = this.hit;
    super.reconcileFromServer(messageModel);
    if (this.hit !== wasHit) {
      this.hitTimer = 5;
    }
  }
*/

  tick() {}

  static whiteMeteor(asset: AssetKeys) {
    if (!this._whiteMeteor[asset]) {
      this._whiteMeteor[asset] = CanvasUtils.mask(OrbitalAssets.assets[asset], 255, 255, 255);
    }
    return this._whiteMeteor[asset]!;
  }
}
