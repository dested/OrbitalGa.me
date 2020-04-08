import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameRules} from "@common/game/gameRules";

export class ClientPlayerEntity extends PlayerEntity implements ClientEntity {
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }

  constructor(game: ClientGame, messageEntity: PlayerModel) {
    super(game, messageEntity.entityId);
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.lastProcessedInputSequenceNumber = messageEntity.lastProcessedInputSequenceNumber;
  }

  zIndex = DrawZIndex.Player;
  draw(context: CanvasRenderingContext2D): void {
    const ship = AssetManager.assets.ship1;
    context.drawImage(ship.image, this.drawX - ship.size.width / 2, this.drawY - ship.size.height / 2);
    this.drawHealth(context);
  }

  private drawHealth(context: CanvasRenderingContext2D) {
    const ship = AssetManager.assets.ship1;
    context.fillStyle = 'white';
    context.fillRect(this.drawX - ship.size.width / 2, this.drawY + ship.size.height / 2, ship.size.width, 5);
    context.fillStyle = 'red';
    context.fillRect(
      this.drawX - ship.size.width / 2 + 1,
      this.drawY + ship.size.height / 2 + 1,
      (ship.size.width - 2) * (this.health / GameRules.player.base.startingHealth),
      3
    );
  }
}
