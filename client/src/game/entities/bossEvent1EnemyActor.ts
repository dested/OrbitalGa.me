import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';
import {OrbitalAssets} from '../../utils/assetManager';
import {BossEvent1EnemyEntity} from '@common/entities/bossEvent1EnemyEntity';
import {unreachable} from '@common/utils/unreachable';
import {Utils} from '@common/utils/utils';

export class BossEvent1EnemyActor extends ClientActor<BossEvent1EnemyEntity> {
  zIndex = DrawZIndex.Player;

  get drawX() {
    return this.entity.position.x + this.entity.xOffset;
  }
  get drawY() {
    return this.entity.position.y + this.entity.yOffset;
  }

  get piece() {
    switch (this.entity.pieceType) {
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
        throw unreachable(this.entity.pieceType);
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    const piece = this.piece;
    context.save();
    context.translate(Math.cos(this.entity.game.stepCount / 20) * 5, Math.sin(this.entity.game.stepCount / 10) * 5);
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.degToRad(this.entity.rotate));
    context.drawImage(piece.image, -piece.size.width / 2, -piece.size.height / 2);
    context.restore();
    context.restore();
  }
  tick() {}
}
