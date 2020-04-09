import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameRules} from '@common/game/gameRules';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientPlayerEntity extends PlayerEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;

  constructor(game: ClientGame, messageModel: PlayerModel) {
    super(game, messageModel.entityId, messageModel.playerColor);
    this.x = messageModel.x;
    this.y = messageModel.y;
    this.lastProcessedInputSequenceNumber = messageModel.lastProcessedInputSequenceNumber;
  }

  get drawX() {
    return this.realX;
  }

  get drawY() {
    return this.realY;
  }

  get ship() {
    switch (this.playerColor) {
      case 'blue':
        return OrbitalAssets.assets['Ships.playerShip1_blue'];
      case 'green':
        return OrbitalAssets.assets['Ships.playerShip1_green'];
      case 'orange':
        return OrbitalAssets.assets['Ships.playerShip1_orange'];
      case 'red':
        return OrbitalAssets.assets['Ships.playerShip1_red'];
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    const ship = this.ship;
    context.drawImage(ship.image, this.drawX - ship.size.width / 2, this.drawY - ship.size.height / 2);
    this.drawHealth(context);
  }

  tick() {}

  private drawHealth(context: CanvasRenderingContext2D) {
    const ship = this.ship;
    context.fillStyle = 'white';
    context.fillRect(this.drawX - ship.size.width / 2, this.drawY + ship.size.height / 2, ship.size.width, 5);
    context.fillStyle = 'red';
    context.fillRect(
      this.drawX - ship.size.width / 2 + 1,
      this.drawY + ship.size.height / 2 + 1,
      (ship.size.width - 2) * (Math.max(this.health, 0) / GameRules.player.base.startingHealth),
      3
    );
  }
}
