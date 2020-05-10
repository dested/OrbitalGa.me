import {PlayerInput, PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {ServerGame} from '../serverGame';
import {ImpliedEntityType} from '@common/models/serverToClientMessages';
import {Game} from '@common/game/game';

export class ServerPlayerEntity extends PlayerEntity {
  inputsThisTick: number = 0;

  constructor(private serverGame: Game, messageModel: ImpliedEntityType<PlayerModel>) {
    super(serverGame, messageModel);
  }
  applyInput(input: PlayerInput, inputSequenceNumber: number) {
    super.applyInput(input, inputSequenceNumber);
    this.lastProcessedInputSequenceNumber = inputSequenceNumber;
  }

  gameTick(duration: number): void {
    super.gameTick(duration);
    const groupings = this.serverGame.entityClusterer.getGroupings((e) => e.type === 'player');
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
