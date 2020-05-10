import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';

import {OrbitalAssets} from '../../utils/assetManager';
import {OrbitalGame} from '@common/game/game';

export class ClientEnemyShotEntity extends EnemyShotEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;

  constructor(game: OrbitalGame, messageModel: EnemyShotModel) {
    super(game, messageModel);
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }
  destroyClient(): void {}
  draw(context: CanvasRenderingContext2D): void {
    const laserRed = OrbitalAssets.assets['Lasers.laserRed03'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Math.PI);
    context.drawImage(laserRed.image, -laserRed.size.width / 2, -laserRed.size.height / 2);
    context.restore();
  }
  tick() {}
}
