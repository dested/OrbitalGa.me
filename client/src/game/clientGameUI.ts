import {IClientSocket} from '../clientSocket';
import {ClientGame, ClientGameOptions} from './clientGame';
import {assertType} from '@common/utils/utils';
import {GameData} from './gameData';
import {GameConstants} from '@common/game/gameConstants';
import {ClientEntity} from './entities/clientEntity';
import {Entity} from '@common/entities/entity';
import {CanvasUtils} from '../utils/canvasUtils';
import {AllPlayerWeapons} from '@common/entities/playerEntity';
import {OrbitalAssets} from '../utils/assetManager';

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
        GameData.instance.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.height);
        this.draw();
      },
      true
    );

    document.onkeydown = (e) => {
      if (e.keyCode === 65) {
        this.liveEntity?.setKey('shoot', true);
      }
      if (e.keyCode === 66) {
        this.liveEntity!.setKey('weapon', this.liveEntity!.selectedWeapon === 'rocket' ? 'none' : 'rocket');
      }
      if (e.keyCode === 38) {
        this.liveEntity?.setKey('up', true);
      } else if (e.keyCode === 40) {
        this.liveEntity?.setKey('down', true);
      } else if (e.keyCode === 37) {
        this.liveEntity?.setKey('left', true);
      } else if (e.keyCode === 39) {
        this.liveEntity?.setKey('right', true);
      }
      // e.preventDefault();
    };
    document.onkeyup = (e) => {
      if (e.keyCode === 65) {
        this.liveEntity?.setKey('shoot', false);
      }

      if (e.keyCode === 38) {
        this.liveEntity?.setKey('up', false);
      } else if (e.keyCode === 40) {
        this.liveEntity?.setKey('down', false);
      } else if (e.keyCode === 37) {
        this.liveEntity?.setKey('left', false);
      } else if (e.keyCode === 39) {
        this.liveEntity?.setKey('right', false);
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

    this.centerView(gameData);

    context.save();
    const outerBox = gameData.view.outerViewBox;
    const box = gameData.view.viewBox;
    context.scale(gameData.view.scale, gameData.view.scale);
    context.translate(-box.x, -box.y);

    context.font = '25px bold';
    const entities = this.entities.array;
    assertType<(Entity & ClientEntity)[]>(entities);
    const sortedEntities = entities.sort((a, b) => a.zIndex - b.zIndex);

    for (const entity of sortedEntities) {
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

  private centerView(gameData: GameData) {
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
    if (this.lastXY) {
      gameData.view.setCenterPosition(
        gameData.view.transformPoint(this.lastXY.x),
        gameData.view.transformPoint(gameData.view.viewHeight / 2 + this.lastXY.y / 5)
      );
    }
  }
}
