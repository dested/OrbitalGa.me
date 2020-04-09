import {PlayerInput, PlayerEntity} from '@common/entities/playerEntity';

export class ServerPlayerEntity extends PlayerEntity {
  applyInput(input: PlayerInput) {
    super.applyInput(input);
    this.lastProcessedInputSequenceNumber = input.inputSequenceNumber;
  }
  gameTick(): void {
    super.gameTick();
  }
}
