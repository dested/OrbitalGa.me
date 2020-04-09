import {SwoopingEnemyEntity, SwoopingEnemyModel} from '@common/entities/swoopingEnemyEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientSwoopingEnemyEntity extends SwoopingEnemyEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;

  constructor(game: ClientGame, messageModel: SwoopingEnemyModel) {
    super(game, messageModel.entityId, messageModel.enemyColor);
    this.x = messageModel.x;
    this.y = messageModel.y;
    this.health = messageModel.health;
    if (messageModel.create) {
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: messageModel.x,
        y: messageModel.y,
      });
    }

    this.updatePolygon();
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }

  get ship() {
    switch (this.enemyColor) {
      case 'black':
        return OrbitalAssets.assets['Enemies.enemyBlack1'];
      case 'blue':
        return OrbitalAssets.assets['Enemies.enemyBlue1'];
      case 'green':
        return OrbitalAssets.assets['Enemies.enemyGreen1'];
      case 'red':
        return OrbitalAssets.assets['Enemies.enemyRed1'];
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    const ship = this.ship;
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(ship.image, -ship.size.width / 2, -ship.size.height / 2);
    context.restore();
  }
  tick() {}
}
