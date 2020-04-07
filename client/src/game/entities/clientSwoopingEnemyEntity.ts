import {SwoopingEnemyEntity, SwoopingEnemyModel} from '@common/entities/swoopingEnemyEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';

export class ClientSwoopingEnemyEntity extends SwoopingEnemyEntity implements ClientEntity {
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }
  constructor(game: ClientGame, messageEntity: SwoopingEnemyModel) {
    super(game, messageEntity.entityId, messageEntity.health);
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.health = messageEntity.health;
    if (messageEntity.create) {
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: messageEntity.x,
        y: messageEntity.y,
      });
    }

    this.updatePolygon();
  }
  zIndex = DrawZIndex.Player;
  draw(context: CanvasRenderingContext2D): void {
    const enemyShip = AssetManager.assets.ship2;
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Math.PI);
    context.drawImage(enemyShip.image, -enemyShip.size.width / 2, -enemyShip.size.height / 2);
    context.restore();
  }
}
