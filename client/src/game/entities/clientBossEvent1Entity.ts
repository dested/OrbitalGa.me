import {ClientEntity, DrawZIndex} from './clientEntity';

import {BossEvent1Entity, BossEvent1Model} from '@common/entities/bossEvent1Entity';
import {OrbitalGame} from '@common/game/game';

export class ClientBossEvent1Entity extends BossEvent1Entity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Player;

  constructor(game: OrbitalGame, messageModel: BossEvent1Model) {
    super(game, messageModel);
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }
  destroyClient(): void {}

  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
