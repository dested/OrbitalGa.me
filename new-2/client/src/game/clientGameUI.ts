import {Manager, Pan, Pinch, Press, Swipe, Tap} from 'hammerjs';
import {ClientSocket, IClientSocket} from '../clientSocket';
import {ClientGame, LivePlayerEntity} from './clientGame';
import {GameView} from './gameView';
import {assert, Utils} from '../../../common/src/utils/utils';
import {start} from 'repl';
import {EnemyShotEntity, ShotEntity, SwoopingEnemyEntity, WallEntity} from '../../../common/src/entities/entity';
import {INoise, noise} from '../utils/perlin';
import {unreachable} from '../../../common/src/utils/unreachable';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  view: GameView;
  private noise: INoise = noise;

  constructor(options: {onDied: () => void; onDisconnect: () => void}, socket: IClientSocket) {
    super(options, socket);
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;
    this.view = new GameView(this.canvas);

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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.view.setBounds(window.innerWidth, window.innerHeight);
        this.draw();
      },
      true
    );

    let lastPress: Date = new Date();
    let doubleTap = false;
    manager.on('press', e => {
      doubleTap = +new Date() - +lastPress < 200;
      lastPress = new Date();
    });
    manager.on('pressup', e => {
      doubleTap = false;
    });

    const path: {x: number; y: number}[] = [];
    let startPoint: {x: number; y: number};
    manager.on('tap', e => {
      if (path.length === 0) {
        path.push({x: 0, y: 0});
        startPoint = e.center;
      } else {
        path.push({x: e.center.x - startPoint.x, y: e.center.y - startPoint.y});
      }
      console.log(JSON.stringify(path, null, 2));
    });

    manager.on('doubletap', e => {});
    document.onkeydown = e => {
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
    document.onkeyup = e => {
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

  frame = 0;
  draw() {
    this.frame++;
    const context = this.context;

    context.fillStyle = 'rgba(0,0,0,1)';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.connectionId) {
      context.fillStyle = 'white';
      context.fillText('Connecting...', 100, 100);
      return;
    }
    context.save();

    context.save();
    const outerBox = this.view.outerViewBox;
    const box = this.view.viewBox;
    context.scale(this.view.scale, this.view.scale);
    context.translate(-box.x, -box.y);

    context.save();
    context.translate(0, this.frame / 2);
    for (const element of this.getStars()) {
      context.fillStyle = `rgba(255,255,255,${element.n / 2})`;
      context.fillRect(
        element.x + (16 - element.n * 16) / 2,
        element.y + (16 - element.n * 16) / 2,
        16 * element.n,
        16 * element.n
      );
    }
    context.restore();

    context.font = '25px bold';
    for (const entity of this.entities) {
      switch (entity.type) {
        case 'player':
          break;
        case 'enemyShot':
          assert(entity instanceof EnemyShotEntity);
          context.fillStyle = 'pink';
          // context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 5, entity.y - 5, 10, 10);
          break;
        case 'wall':
          assert(entity instanceof WallEntity);
          context.fillStyle = 'white';
          context.fillRect(entity.x, entity.y, entity.width, entity.height);
          break;
        case 'shot':
          assert(entity instanceof ShotEntity);
          context.fillStyle = 'yellow';
          // context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 5, entity.y - 5, 10, 10);
          break;
        case 'swoopingEnemy':
          assert(entity instanceof SwoopingEnemyEntity);
          context.fillStyle = 'rgba(255,0,0,.5)';
          context.fillText(`${entity.health.toFixed(0)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 25, entity.y - 25, 50, 50);
          break;
        default:
          unreachable(entity.type);
          break;
      }
    }

    for (const entity of this.entities) {
      switch (entity.type) {
        case 'player':
          if (entity instanceof LivePlayerEntity) {
            context.fillStyle = 'green';
            // context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);

            if (!entity.positionLerp) {
              context.fillRect(entity.x - 15, entity.y - 15, 30, 30);
            } else {
              const {x, y, startTime, duration} = entity.positionLerp;
              const now = +new Date();
              if (now >= startTime + duration) {
                context.fillRect(entity.x - 15, entity.y - 15, 30, 30);
              } else {
                context.fillRect(
                  Utils.lerp(x, entity.x, (now - startTime) / duration) - 15,
                  Utils.lerp(y, entity.y, (now - startTime) / duration) - 15,
                  30,
                  30
                );
              }
            }
          } else {
            context.fillStyle = 'blue';
            // context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
            context.fillRect(entity.x - 15, entity.y - 15, 30, 30);
          }
          break;
      }
    }
    context.restore();

    context.restore();
  }

  *getStars(): Iterable<Star> {
    const starX = Math.round(this.view.viewX / 16);
    const starW = Math.round((this.view.viewX + this.view.viewWidth) / 16);
    const starY = Math.round((this.view.viewY - this.frame / 2) / 16);
    const starH = Math.round((this.view.viewY - this.frame / 2 + this.view.viewHeight) / 16);

    for (let x = starX - 2; x < starW + 2; x += 1) {
      for (let y = starY - 5; y < starH + 5; y += 1) {
        const n = this.noise.simplex2(x, y);
        if (n < 1) {
          yield {x: x * 16, y: y * 16, n};
        }
      }
    }
  }
}

type Star = {x: number; y: number; n: number};
