import {IClientSocket} from '../clientSocket';
import {ClientGame, ClientGameOptions} from './clientGame';
import {assertType} from '@common/utils/utils';
import {GameData} from './gameData';
import {GameConstants} from '@common/game/gameConstants';
import {ClientEntity} from './entities/clientEntity';
import {Entity} from '@common/entities/entity';
import {ClientShotExplosionEntity} from './entities/clientShotExplosionEntity';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(serverPath: string, options: ClientGameOptions, socket: IClientSocket) {
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
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const gameData = GameData.instance;
    if (this.liveEntity) {
      gameData.view.setCenterPosition(
        gameData.view.transformPoint(this.liveEntity.drawX),
        gameData.view.transformPoint(gameData.view.viewHeight / 2 + this.liveEntity.drawY / 5 /*todo this isnt good*/)
      );
    }
    if (this.spectatorMode && this.spectatorEntity) {
      gameData.view.setCenterPosition(
        gameData.view.transformPoint(this.spectatorEntity.x),
        gameData.view.transformPoint(gameData.view.viewHeight / 2 + GameConstants.playerStartingY / 5)
      );
    }

    if (!this.connectionId) {
      context.fillStyle = 'white';
      context.fillText('Connecting...', 100, 100);
      return;
    }
    context.save();

    const outerBox = gameData.view.outerViewBox;
    const box = gameData.view.viewBox;
    context.scale(gameData.view.scale, gameData.view.scale);
    context.translate(-box.x, -box.y);

    context.font = '25px bold';
    const entities = this.entities.array;
    assertType<(Entity & ClientEntity)[]>(entities);
    for (const entity of entities.sort((a, b) => a.zIndex - b.zIndex)) {
      if (!gameData.view.contains(entity.realX, entity.realY)) {
        continue;
      }
      entity.draw(context);
    }

    context.restore();

    if (GameConstants.debugClient) {
      context.save();
      context.font = '30px bold';
      context.fillStyle = 'white';
      context.textBaseline = 'top';
      let debugY = 0;
      for (const key of Object.keys(this.debugValues)) {
        context.fillText(`${key}: ${this.debugValues[key]}`, this.canvas.width * 0.8, debugY);
        debugY += 30;
      }
      context.restore();
    }

    if (GameConstants.debugCollisions) {
      context.save();
      context.beginPath();
      context.scale(gameData.view.scale, gameData.view.scale);
      context.translate(-box.x, -box.y);
      this.collisionEngine.draw(context);
      context.fillStyle = 'rgba(255,0,85,0.4)';
      context.fill();
      context.restore();
    }
  }
}
