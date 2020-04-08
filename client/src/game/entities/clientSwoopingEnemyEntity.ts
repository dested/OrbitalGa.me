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
  draw(context: CanvasRenderingContext2D): void {
    let enemyShip: Asset<AssetKeys>;
    switch (this.enemyColor) {
      case 'black':
        enemyShip = OrbitalAssets.assets['Enemies.enemyBlack1'];
        break;
      case 'blue':
        enemyShip = OrbitalAssets.assets['Enemies.enemyBlue1'];
        break;
      case 'green':
        enemyShip = OrbitalAssets.assets['Enemies.enemyGreen1'];
        break;
      case 'red':
        enemyShip = OrbitalAssets.assets['Enemies.enemyRed1'];
        break;
    }
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(enemyShip.image, -enemyShip.size.width / 2, -enemyShip.size.height / 2);
    context.restore();
  }
  tick() {}
}
