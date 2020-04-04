import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';

export class ClientSwoopingEnemyEntity extends SwoopingEnemyEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;
  draw(context: CanvasRenderingContext2D): void {
    const enemyShip = AssetManager.assets.ship2;
    context.save();
    context.translate(this.x, this.y);
    context.rotate(Math.PI);
    context.drawImage(enemyShip.image, -enemyShip.size.width / 2, -enemyShip.size.height / 2);
    context.restore();
  }
}
