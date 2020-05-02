import {ClientGame, ClientGameOptions} from './clientGame';
import {assertType} from '@common/utils/utils';
import {GameData} from './gameData';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {ClientEntity} from './entities/clientEntity';
import {Entity} from '@common/entities/entity';
import keyboardJS from 'keyboardjs';
import {IClientSocket} from '../socket/IClientSocket';

export class ClientGameUI extends ClientGame {
  drawTick = 0;
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
        GameData.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.height);
        this.draw();
      },
      true
    );

    keyboardJS.bind(
      'w',
      () => this.liveEntity?.setKey('up', true),
      () => this.liveEntity?.setKey('up', false)
    );
    keyboardJS.bind(
      'a',
      () => this.liveEntity?.setKey('left', true),
      () => this.liveEntity?.setKey('left', false)
    );
    keyboardJS.bind(
      's',
      () => this.liveEntity?.setKey('down', true),
      () => this.liveEntity?.setKey('down', false)
    );

    keyboardJS.bind(
      'd',
      () => this.liveEntity?.setKey('right', true),
      () => this.liveEntity?.setKey('right', false)
    );
    keyboardJS.bind(
      'space',
      () => this.liveEntity?.setKey('shoot', true),
      () => this.liveEntity?.setKey('shoot', false)
    );

    const requestNextFrame = () => {
      requestAnimationFrame(() => {
        this.draw();
        requestNextFrame();
      });
    };
    requestNextFrame();
  }
  draw() {
    this.drawTick++;
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const gameData = GameData;

    this.centerView();

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
    this.liveEntity?.staticDraw(context);
    /*const nose = OrbitalAssets.assets['Rocket_parts.spaceRocketParts_008'];
    if (nose) {
      this.drawTick++;
      const body1 = OrbitalAssets.assets['Rocket_parts.spaceRocketParts_026'];
      const body2 = OrbitalAssets.assets['Rocket_parts.spaceRocketParts_027'];
      const body3 = OrbitalAssets.assets['Rocket_parts.spaceRocketParts_028'];
      const bodyBack1 = OrbitalAssets.assets['Rocket_parts.spaceRocketParts_032'];
      const bodyBack2 = OrbitalAssets.assets['Rocket_parts.spaceRocketParts_033'];
      const noseOffsetX = nose.size.width / 2;
      const bodyOffsetX = body1.size.width / 2;
      const bodyBackOffsetY = bodyBack1.size.height - 10;
      const bodyOffsetY = bodyBackOffsetY + body1.size.height * 2 - nose.size.height;
      const noseOffsetY = bodyOffsetY + nose.size.height;
      const items = [
        {asset: nose, rotate: 180, offsetX: noseOffsetX, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 2, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 4, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 6, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 8, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 10, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 12, offsetY: noseOffsetY},
        {asset: nose, rotate: 180, offsetX: noseOffsetX + nose.size.width * 14, offsetY: noseOffsetY},
        {asset: body1, rotate: 180, offsetX: bodyOffsetX, offsetY: bodyOffsetY},
        {asset: body2, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 2, offsetY: bodyOffsetY},
        {asset: body3, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 4, offsetY: bodyOffsetY},
        {asset: body1, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 6, offsetY: bodyOffsetY},
        {asset: body2, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 8, offsetY: bodyOffsetY},
        {asset: body3, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 10, offsetY: bodyOffsetY},
        {asset: body3, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 12, offsetY: bodyOffsetY},
        {asset: body1, rotate: 180, offsetX: bodyOffsetX + body1.size.width * 14, offsetY: bodyOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX, offsetY: bodyBackOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX + nose.size.width, offsetY: bodyBackOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX + nose.size.width * 2, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 3, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 4, offsetY: bodyBackOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX + nose.size.width * 5, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 6, offsetY: bodyBackOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX + nose.size.width * 7, offsetY: bodyBackOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX + nose.size.width * 8, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 9, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 10, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 11, offsetY: bodyBackOffsetY},
        {asset: bodyBack1, rotate: 0, offsetX: noseOffsetX + nose.size.width * 12, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 13, offsetY: bodyBackOffsetY},
        {asset: bodyBack2, rotate: 0, offsetX: noseOffsetX + nose.size.width * 14, offsetY: bodyBackOffsetY},
      ];

      for (const item of items) {
        context.save();
        context.translate(
          item.offsetX - item.asset.size.width / 2 + Math.cos(this.drawTick / 20) * 5,
          item.offsetY - item.asset.size.height / 2 + Math.sin(this.drawTick / 10) * 5
        );
        context.rotate(Utils.degToRad(item.rotate));
        context.drawImage(item.asset.image, -item.asset.size.width / 2, -item.asset.size.height / 2);
        context.restore();
      }
    }*/

    if (GameDebug.client) {
      context.save();
      context.font = '22px bold';
      context.fillStyle = 'white';
      context.textBaseline = 'top';
      let debugY = context.canvas.height - 22;
      for (const key of Object.keys(this.debugValues)) {
        context.fillText(`${key}: ${this.debugValues[key]}`, 0, debugY);
        debugY -= 22;
      }
      context.fillText(`Average Lag between ticks: ${this.lagAverage.average.toFixed(1)}ms`, 0, debugY);
      debugY -= 22;
      context.fillText(`Latency: ${this.latency.toFixed(1)}ms`, 0, debugY);
      context.restore();
    }

    if (GameDebug.collisions) {
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

  private centerView() {
    if (this.liveEntity) {
      GameData.view.setCenterPosition(
        GameData.view.transformPoint(this.liveEntity.drawX),
        GameData.view.transformPoint(GameData.view.viewHeight / 2 + this.liveEntity.drawY / 5 /*todo this isnt good*/)
      );
    }
    if (this.spectatorMode && this.spectatorEntity) {
      GameData.view.setCenterPosition(
        GameData.view.transformPoint(this.spectatorEntity.x),
        GameData.view.transformPoint(GameData.view.viewHeight / 2 + GameConstants.playerStartingY / 5)
      );
    }
    if (this.lastXY) {
      GameData.view.setCenterPosition(
        GameData.view.transformPoint(this.lastXY.x),
        GameData.view.transformPoint(GameData.view.viewHeight / 2 + this.lastXY.y / 5)
      );
    }
  }
}
