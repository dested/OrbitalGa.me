import {LivePlayerModel, PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameRules} from '@common/game/gameRules';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientPlayerEntity extends PlayerEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;

  constructor(protected clientGame: ClientGame, messageModel: PlayerModel | LivePlayerModel) {
    super(clientGame, messageModel.entityId, messageModel.playerColor);
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

    this.drawFire(context);

    context.drawImage(ship.image, this.drawX - ship.size.width / 2, this.drawY - ship.size.height / 2);
    this.drawHealth(context);
  }

  tick() {}

  private drawFire(context: CanvasRenderingContext2D) {
    if (this.lastPlayerInput?.up) {
      context.save();
      const fire =
        this.clientGame.drawTick % 8 < 4
          ? OrbitalAssets.assets['Effects.fire16']
          : OrbitalAssets.assets['Effects.fire17'];
      context.drawImage(fire.image, this.drawX - 30, this.drawY + 20);
      context.drawImage(fire.image, this.drawX + 16, this.drawY + 20);
      context.restore();
    } else if (this.lastPlayerInput?.down || this.lastPlayerInput?.left || this.lastPlayerInput?.right) {
      context.save();
      const fire =
        this.clientGame.drawTick % 8 < 4
          ? OrbitalAssets.assets['Effects.fire16']
          : OrbitalAssets.assets['Effects.fire17'];
      context.drawImage(fire.image, this.drawX - 30, this.drawY + 10);
      context.drawImage(fire.image, this.drawX + 16, this.drawY + 10);
      context.restore();
    }
  }

  private drawHealth(context: CanvasRenderingContext2D) {
    const ship = this.ship;
    context.fillStyle = 'rgba(255,255,255,0.4)';
    context.fillRect(this.drawX - ship.size.width / 2, this.drawY + ship.size.height / 2, ship.size.width, 5);
    context.fillStyle = 'rgba(254,0,0,0.4)';
    context.fillRect(
      this.drawX - ship.size.width / 2 + 1,
      this.drawY + ship.size.height / 2 + 1,
      (ship.size.width - 2) * (this.health / GameRules.player.base.startingHealth),
      3
    );
  }
}
