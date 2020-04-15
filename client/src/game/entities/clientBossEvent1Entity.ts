import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {BossEvent1Entity, BossEvent1Model} from '@common/entities/bossEvent1Entity';

export class ClientBossEvent1Entity extends BossEvent1Entity implements ClientEntity {
  zIndex = DrawZIndex.Player;

  constructor(game: ClientGame, messageModel: BossEvent1Model) {
    super(game, messageModel);
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }

  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
