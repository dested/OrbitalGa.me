import {WallEntity, WallModel} from '@common/entities/wallEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {OrbitalGame} from '@common/game/game';


export class ClientWallEntity extends WallEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Scenery;

  constructor(game: OrbitalGame, messageModel: WallModel) {
    super(game, messageModel);
  }
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }
  destroyClient(): void {}
  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'white';
    context.fillRect(this.drawX, this.drawY, this.width, this.height);
  }
  tick() {}
}
