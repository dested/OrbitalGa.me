import {SwoopingEnemyEntity, SwoopingEnemyModel} from '@common/entities/swoopingEnemyEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Asset, OrbitalAssets} from '../../utils/assetManager';
import {AssetKeys} from '../../assets';

export class ClientSwoopingEnemyEntity extends SwoopingEnemyEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;

  constructor(game: ClientGame, messageEntity: SwoopingEnemyModel) {
    super(game, messageEntity.entityId, messageEntity.enemyColor);
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
