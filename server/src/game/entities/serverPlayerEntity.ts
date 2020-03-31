import {PendingInput, PlayerEntity} from '@common/entities/playerEntity';

export class ServerPlayerEntity extends PlayerEntity {
  tick(): void {
    super.tick();
  }

  applyInput(input: PendingInput) {
    super.applyInput(input);
    this.lastProcessedInputSequenceNumber = input.inputSequenceNumber;
  }
}
