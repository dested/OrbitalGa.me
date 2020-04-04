import {PlayerEntity} from '@common/entities/playerEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';

export class ClientPlayerEntity extends PlayerEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;
  draw(context: CanvasRenderingContext2D): void {
    const ship = AssetManager.assets.ship1;
    context.drawImage(ship.image, this.x - ship.size.width / 2, this.y - ship.size.height / 2);
  }
}
