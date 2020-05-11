import {PlayerWeaponEntity, PlayerWeaponModel} from '@common/entities/playerWeaponEntity';
import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {OrbitalAssets} from '../../utils/assetManager';
import {ClientPlayerActor} from './clientPlayerActor';
import {unreachable} from '@common/utils/unreachable';
import {Utils} from '@common/utils/utils';
import {GameConstants} from '@common/game/gameConstants';
import {WeaponConfigs} from '@common/game/gameRules';
import {OrbitalGame} from '@common/game/game';

export class ClientPlayerWeaponActor extends ClientActor<PlayerWeaponEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;

  get asset() {
    switch (this.entity.weaponType) {
      case 'rocket':
        return OrbitalAssets.assets['Missiles.spaceMissiles_001'];
      case 'laser1':
        return OrbitalAssets.assets['Lasers.laserBlue03'];
      case 'laser1Spray10':
        return OrbitalAssets.assets['Lasers.laserBlue03'];
      case 'laser2':
        return OrbitalAssets.assets['Lasers.laserBlue02'];
      case 'torpedo':
        return OrbitalAssets.assets['Missiles.spaceMissiles_004'];
      default:
        throw unreachable(this.entity.weaponType);
    }
  }

  get drawX() {
    return this.entity.position.x;
  }

  get drawY() {
    return this.entity.position.y;
  }

  get owner() {
    return this.entity.game.entities.lookup<ClientPlayerActor>(this.entity.ownerEntityId);
  }

  draw(context: CanvasRenderingContext2D): void {
    const asset = this.asset;
    context.save();
    context.translate(this.drawX, this.drawY);
    this.drawFire(context);
    if (this.entity.sprayAngle > 0) {
      context.rotate(Utils.degToRad(90 + this.entity.sprayAngle));
    }
    context.drawImage(asset.image, -asset.size.width / 2, -asset.size.height / 2);
    context.restore();
  }

  drawFire(context: CanvasRenderingContext2D) {
    const asset = this.asset;
    switch (this.entity.weaponType) {
      case 'rocket': {
        const fire =
          this.entity.game.stepCount % 8 < 4
            ? OrbitalAssets.assets['Effects.fire14']
            : OrbitalAssets.assets['Effects.fire15'];
        context.drawImage(fire.image, -fire.size.width / 2, asset.size.height / 2);
        break;
      }
      case 'laser1Spray10':
      case 'laser1':
      case 'laser2':
        break;
      case 'torpedo': {
        const fire =
          this.entity.game.stepCount % 8 < 4
            ? OrbitalAssets.assets['Effects.fire14']
            : OrbitalAssets.assets['Effects.fire15'];
        context.drawImage(fire.image, -fire.size.width / 2, asset.size.height / 2);
        break;
      }
      default:
        unreachable(this.entity.weaponType);
        break;
    }
  }

  tick() {}
}
