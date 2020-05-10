import {ClientEntity, DrawZIndex} from './clientEntity';

import {OrbitalAssets} from '../../utils/assetManager';
import {BossEvent1EnemyEntity, BossEvent1EnemyModel} from '@common/entities/bossEvent1EnemyEntity';
import {unreachable} from '@common/utils/unreachable';
import {Utils} from '@common/utils/utils';
import {OrbitalGame} from '@common/game/game';

export class ClientBossEvent1EnemyEntity extends BossEvent1EnemyEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Player;

  constructor(public clientGame: OrbitalGame, messageModel: BossEvent1EnemyModel) {
    super(clientGame, messageModel);
    this.updatePolygon();
  }
  get drawX() {
    return this.position.x + this.xOffset;
  }
  get drawY() {
    return this.position.y + this.yOffset;
  }

  get piece() {
    switch (this.pieceType) {
      case 'nose':
        return OrbitalAssets.assets['Rocket_parts.spaceRocketParts_008'];
      case 'body1':
        return OrbitalAssets.assets['Rocket_parts.spaceRocketParts_026'];
      case 'body2':
        return OrbitalAssets.assets['Rocket_parts.spaceRocketParts_027'];
      case 'body3':
        return OrbitalAssets.assets['Rocket_parts.spaceRocketParts_028'];
      case 'bodyBack1':
        return OrbitalAssets.assets['Rocket_parts.spaceRocketParts_032'];
      case 'bodyBack2':
        return OrbitalAssets.assets['Rocket_parts.spaceRocketParts_033'];
      default:
        throw unreachable(this.pieceType);
    }
  }
  destroyClient(): void {}

  draw(context: CanvasRenderingContext2D): void {
    const piece = this.piece;
    context.save();
    context.translate(Math.cos(this.clientGame.drawTick / 20) * 5, Math.sin(this.clientGame.drawTick / 10) * 5);
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.degToRad(this.rotate));
    context.drawImage(piece.image, -piece.size.width / 2, -piece.size.height / 2);
    context.restore();
    context.restore();
  }
  tick() {}
}
