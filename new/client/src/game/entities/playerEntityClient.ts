import {PlayerEntity} from '../../../../common/src/game/entities/playerEntity';
import {AssetManager} from '../../utils/assetManager';

export class PlayerEntityClient extends PlayerEntity {
  draw(context: CanvasRenderingContext2D) {
    const x = this.x;
    const y = this.y;
    context.fillStyle = 'white';
    context.font = '20px Arial';
    // context.fillText(`${this.x.toFixed()},${this.y.toFixed()}`, x, y - 10);
    if (this.msg) {
      context.fillText(`${this.msg}`, 0, 80);
    }
    const ship = AssetManager.assets[this.shipType];
    if (ship) context.drawImage(ship.image, x - ship.size.width / 2, y - ship.size.height / 2);

    // context.fillStyle = this.color;
    // context.fillRect(x - 10, y - 10, 20, 20);
  }
}
