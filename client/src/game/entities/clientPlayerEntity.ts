import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';

export class ClientPlayerEntity extends PlayerEntity implements ClientEntity {
  constructor(game: ClientGame, messageEntity: PlayerModel) {
    super(game, messageEntity.entityId);
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.lastProcessedInputSequenceNumber = messageEntity.lastProcessedInputSequenceNumber;
  }

  zIndex = DrawZIndex.Player;
  draw(context: CanvasRenderingContext2D): void {
    const ship = AssetManager.assets.ship1;
    context.drawImage(ship.image, this.x - ship.size.width / 2, this.y - ship.size.height / 2);
  }
}
