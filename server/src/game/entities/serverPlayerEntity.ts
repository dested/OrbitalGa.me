import {PlayerInput, PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {ImpliedEntityType} from '@common/models/serverToClientMessages';
import {OrbitalGame} from '@common/game/game';
import {ImpliedDefaultPhysics} from '@common/baseEntities/physicsEntity';

export class ServerPlayerEntity extends PlayerEntity {
  constructor(
    private serverGame: OrbitalGame,
    messageModel: ImpliedDefaultPhysics<Omit<PlayerModel, 'playerInputKeys'>>
  ) {
    super(serverGame, messageModel);
  }

  gameTick(duration: number): void {
    super.gameTick(duration);
    const groupings = this.serverGame.entityClusterer.getGroupings((e) => e.type === 'player');
    const x0 = groupings[0].x0;
    const x1 = groupings[groupings.length - 1].x1;
    if (this.position.x < x0) {
      this.position.x = x0;
      this.velocity.set(0, this.velocity.y);
    }
    if (this.position.x > x1) {
      this.position.x = x1;
      this.velocity.set(0, this.velocity.y);
    }
  }
}
