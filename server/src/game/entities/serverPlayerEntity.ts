import {PendingInput, PlayerEntity} from '@common/entities/playerEntity';

export class ServerPlayerEntity extends PlayerEntity {
  gameTick(): void {
    super.gameTick();
  }

  applyInput(input: PendingInput) {
    super.applyInput(input);
    this.lastProcessedInputSequenceNumber = input.inputSequenceNumber;
  }
}
