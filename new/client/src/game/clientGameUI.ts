import {Manager, Pan, Pinch, Press, Swipe, Tap} from 'hammerjs';
import {ClientSocket, IClientSocket} from '../clientSocket';
import {ClientGame} from './clientGame';
import {GameView} from './gameView';
import {INoise, noise} from '../utils/perlin';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private view: GameView;
  private noise: INoise = noise;

  constructor(options: {onDisconnect: () => void}, socket: IClientSocket) {
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

    manager.on('tap', e => {});

    manager.on('doubletap', e => {});

    document.onkeydown = e => {
      if (e.keyCode === 65) {
        this.liveEntity.pressShoot();
      }
      if (e.keyCode === 38) {
        this.liveEntity.pressUp();
      } else if (e.keyCode === 40) {
        this.liveEntity.pressDown();
      } else if (e.keyCode === 37) {
        this.liveEntity.pressLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity.pressRight();
      }
      // e.preventDefault();
    };
    document.onkeyup = e => {
      if (e.keyCode === 65) {
        this.liveEntity.releaseShoot();
      }
      if (e.keyCode === 38) {
        this.liveEntity.releaseUp();
      } else if (e.keyCode === 40) {
        this.liveEntity.releaseDown();
      } else if (e.keyCode === 37) {
        this.liveEntity.releaseLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity.releaseRight();
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
    if (this.liveEntity) {
      this.view.setCenterPosition(this.view.transformPoint(this.liveEntity.x), this.view.viewHeight / 2);
    }

    context.fillStyle = 'rgba(0,0,0,1)';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.connectionId) {
      context.fillStyle = 'white';
      context.fillText('Connecting...', 100, 100);
      return;
    }

    context.save();
    const outerBox = this.view.outerViewBox;
    const box = this.view.viewBox;
    context.scale(this.view.scale, this.view.scale);
    context.translate(-box.x, -box.y);

    context.save();
    context.translate(0, this.frame);
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

    super.draw(context);
    context.restore();
  }

  *getStars(): Iterable<Star> {
    const starX = Math.round(this.view.viewX / 16);
    const starW = Math.round((this.view.viewX + this.view.viewWidth) / 16);
    const starY = Math.round((this.view.viewY - this.frame) / 16);
    const starH = Math.round((this.view.viewY - this.frame + this.view.viewHeight) / 16);

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

export class Star {
  x: number;
  y: number;
  n: number;
}
