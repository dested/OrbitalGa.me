import {assertType} from '@common/utils/utils';
import {GameData} from './gameData';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {Entity} from '@common/baseEntities/entity';
import keyboardJS from 'keyboardjs';
import {IClientSocket} from '../socket/IClientSocket';
import {ClientEngine, ClientGameOptions} from './clientEngine';
import {OrbitalGame} from '@common/game/game';

export class ClientEngineUI {
  clientEngine: ClientEngine;
  drawTick = 0;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(serverPath: string, options: ClientGameOptions, socket: IClientSocket) {
    this.clientEngine = new ClientEngine(serverPath, options, socket, new OrbitalGame(true));
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
      () => this.clientEngine.setKey('up', true),
      () => this.clientEngine.setKey('up', false)
    );
    keyboardJS.bind(
      'a',
      () => this.clientEngine.setKey('left', true),
      () => this.clientEngine.setKey('left', false)
    );
    keyboardJS.bind(
      's',
      () => this.clientEngine.setKey('down', true),
      () => this.clientEngine.setKey('down', false)
    );

    keyboardJS.bind(
      'd',
      () => this.clientEngine.setKey('right', true),
      () => this.clientEngine.setKey('right', false)
    );
    keyboardJS.bind(
      'space',
      () => this.clientEngine.setKey('shoot', true),
      () => this.clientEngine.setKey('shoot', false)
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
    const box = gameData.view.viewBox;
    context.scale(gameData.view.scale, gameData.view.scale);
    context.translate(-box.x, -box.y);

    context.font = '25px bold';
    const entities = this.clientEngine.game.entities.array;
    for (const entity of entities) {
      if(!entity.actor){
        debugger;
      }
    }
    const sortedEntities = entities.sort((a, b) => a.actor!.zIndex - b.actor!.zIndex);

    for (const entity of sortedEntities) {
      if (!entity.inView(gameData.view.outerViewBox)) {
        continue;
      }
      entity.actor!.draw(context);
    }

    context.restore();
    for (const entity of sortedEntities) {
      if (!entity.inView(gameData.view.outerViewBox)) {
        continue;
      }
      entity.actor!.staticDraw(context);
    }
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
      for (const key of Object.keys(this.clientEngine.debugValues)) {
        context.fillText(`${key}: ${this.clientEngine.debugValues[key]}`, 0, debugY);
        debugY -= 22;
      }
      context.restore();
    }

    if (GameDebug.collisions) {
      context.save();
      context.beginPath();
      context.scale(gameData.view.scale, gameData.view.scale);
      context.translate(-box.x, -box.y);
      this.clientEngine.game.collisionEngine.draw(context);
      context.fillStyle = 'rgba(255,0,85,0.4)';
      context.fill();
      context.restore();
    }
  }

  private centerView() {
    if (this.clientEngine.game.clientPlayer) {
      GameData.view.setCenterPosition(
        GameData.view.transformPoint(this.clientEngine.game.clientPlayer.position.x),
        GameData.view.transformPoint(
          GameData.view.viewHeight / 2 + this.clientEngine.game.clientPlayer.position.y / 5 /*todo this isnt good*/
        )
      );
    }
    if (this.clientEngine.spectatorMode && this.clientEngine.game.spectatorEntity) {
      GameData.view.setCenterPosition(
        GameData.view.transformPoint(this.clientEngine.game.spectatorEntity.position.x),
        GameData.view.transformPoint(GameData.view.viewHeight / 2 + GameConstants.playerStartingY / 5)
      );
    }
    if (this.clientEngine.lastXY) {
      GameData.view.setCenterPosition(
        GameData.view.transformPoint(this.clientEngine.lastXY.x),
        GameData.view.transformPoint(GameData.view.viewHeight / 2 + this.clientEngine.lastXY.y / 5)
      );
    }
  }
}
