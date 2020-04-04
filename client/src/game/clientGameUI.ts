import {Manager, Press, Tap} from 'hammerjs';
import {IClientSocket} from '../clientSocket';
import {ClientGame} from './clientGame';
import {assert, assertType} from '@common/utils/utils';
import {unreachable} from '@common/utils/unreachable';
import {GameData} from './gameData';
import {AssetManager} from '../utils/assetManager';
import {WallEntity} from '@common/entities/wallEntity';
import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {ShotEntity} from '@common/entities/shotEntity';
import {EnemyShotEntity} from '@common/entities/enemyShotEntity';
import {GameConstants} from '@common/game/gameConstants';
import {LivePlayerEntity} from './entities/livePlayerEntity';
import {ShotExplosionEntity} from '@common/entities/shotExplosionEntity';
import {ClientEntity} from './entities/clientEntity';
import {Entity} from '@common/entities/entity';
import {ArrayHash} from '@common/utils/arrayHash';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(serverPath: string, options: {onDied: () => void; onDisconnect: () => void}, socket: IClientSocket) {
    super(serverPath, options, socket);
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    const manager = new Manager(this.canvas);
    manager.add(new Press({time: 0}));
    manager.add(new Tap({event: 'doubletap', taps: 2, interval: 500})).recognizeWith(manager.get('press'));
    manager
      .add(new Tap({taps: 1}))
      .requireFailure('doubletap')
      .recognizeWith(manager.get('press'));

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

    let lastPress: Date = new Date();
    let doubleTap = false;
    manager.on('press', (e) => {
      doubleTap = +new Date() - +lastPress < 200;
      lastPress = new Date();

      if (e.center.x < window.innerWidth / 2) {
        this.liveEntity?.pressLeft();
      }
      if (e.center.x >= window.innerWidth / 2) {
        this.liveEntity?.pressRight();
      }
    });
    manager.on('pressup', (e) => {
      doubleTap = false;
      this.liveEntity?.releaseLeft();
      this.liveEntity?.releaseRight();
    });

    /*const path: {x: number; y: number}[] = [];
    let startPoint: {x: number; y: number};
    manager.on('tap', (e) => {
      if (path.length === 0) {
        path.push({x: 0, y: 0});
        startPoint = e.center;
      } else {
        path.push({x: e.center.x - startPoint.x, y: e.center.y - startPoint.y});
      }
      console.log(JSON.stringify(path, null, 2));
    });*/

    manager.on('doubletap', (e) => {});
    document.onkeydown = (e) => {
      if (e.keyCode === 65) {
        this.liveEntity?.pressShoot();
      }
      if (e.keyCode === 38) {
        this.liveEntity?.pressUp();
      } else if (e.keyCode === 40) {
        this.liveEntity?.pressDown();
      } else if (e.keyCode === 37) {
        this.liveEntity?.pressLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity?.pressRight();
      }
      // e.preventDefault();
    };
    document.onkeyup = (e) => {
      if (e.keyCode === 65) {
        this.liveEntity?.releaseShoot();
      }

      if (e.keyCode === 38) {
        this.liveEntity?.releaseUp();
      } else if (e.keyCode === 40) {
        this.liveEntity?.releaseDown();
      } else if (e.keyCode === 37) {
        this.liveEntity?.releaseLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity?.releaseRight();
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
