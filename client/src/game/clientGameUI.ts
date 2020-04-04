import {IClientSocket} from '../clientSocket';
import {ClientGame} from './clientGame';
import {assertType} from '@common/utils/utils';
import {GameData} from './gameData';
import {GameConstants} from '@common/game/gameConstants';
import {ClientEntity} from './entities/clientEntity';
import {Entity} from '@common/entities/entity';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(serverPath: string, options: {onDied: () => void; onDisconnect: () => void}, socket: IClientSocket) {
    super(serverPath, options, socket);
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    window.addEventListener(
      'resize',
      () => {
        this.canvas.width = GameConstants.screenSize.width;
        this.canvas.height = GameConstants.screenSize.height;
        GameData.instance.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.width);
        this.draw();
      },
      true
    );

    document.onkeydown = (e) => {
      if (e.keyCode === 65) {
        this.liveEntity?.pressKey('shoot');
      }
      if (e.keyCode === 38) {
        this.liveEntity?.pressKey('up');
      } else if (e.keyCode === 40) {
        this.liveEntity?.pressKey('down');
      } else if (e.keyCode === 37) {
        this.liveEntity?.pressKey('left');
      } else if (e.keyCode === 39) {
        this.liveEntity?.pressKey('right');
      }
      // e.preventDefault();
    };
    document.onkeyup = (e) => {
      if (e.keyCode === 65) {
        this.liveEntity?.releaseKey('shoot');
      }

      if (e.keyCode === 38) {
        this.liveEntity?.releaseKey('up');
      } else if (e.keyCode === 40) {
        this.liveEntity?.releaseKey('down');
      } else if (e.keyCode === 37) {
        this.liveEntity?.releaseKey('left');
      } else if (e.keyCode === 39) {
        this.liveEntity?.releaseKey('right');
      }
    };

    const requestNextFrame = () => {
      requestAnimationFrame(() => {
        this.draw();
        requestNextFrame();
      });
    };
    requestNextFrame();
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.liveEntity) {
      GameData.instance.view.setCenterPosition(
        GameData.instance.view.transformPoint(this.liveEntity.drawX),
        GameData.instance.view.viewHeight / 2 + this.liveEntity.drawY / 5
      );
    }

    if (!this.connectionId) {
      context.fillStyle = 'white';
      context.fillText('Connecting...', 100, 100);
      return;
    }
    context.save();

    const outerBox = GameData.instance.view.outerViewBox;
    const box = GameData.instance.view.viewBox;
    context.scale(GameData.instance.view.scale, GameData.instance.view.scale);
    context.translate(-box.x, -box.y);

    context.font = '25px bold';
    const entities = this.entities.array;
    assertType<(Entity & ClientEntity)[]>(entities);
    for (const entity of entities.sort((a, b) => a.zIndex - b.zIndex)) {
      if (!GameData.instance.view.contains(entity)) {
        continue;
      }
      entity.draw(context);
    }

    context.restore();
  }
}
