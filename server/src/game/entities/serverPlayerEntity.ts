import {PlayerInput, PlayerEntity, PlayerColor} from '@common/entities/playerEntity';
import {ServerGame} from '../serverGame';

export class ServerPlayerEntity extends PlayerEntity {
  constructor(private serverGame: ServerGame, entityId: number, playerColor: PlayerColor) {
    super(serverGame, entityId, playerColor);
  }
  applyInput(input: PlayerInput) {
    super.applyInput(input);
    this.lastProcessedInputSequenceNumber = input.inputSequenceNumber;
  }
  gameTick(): void {
    super.gameTick();
    const groupings = this.serverGame.entityGroupingsThisTick;
    const x0 = groupings[0].x0;
    const x1 = groupings[groupings.length - 1].x1;
    if (this.x < x0) {
      this.x = x0;
      this.momentumX = 0;
    }
    if (this.x > x1) {
      this.x = x1;
      this.momentumX = 0;
    }
  }
}
