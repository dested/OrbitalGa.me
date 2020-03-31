import {AnimationUtils} from '@common/utils/animationUtils';

export class GameView {
  private x: number = 0;
  private y: number = 0;

  scale: number;

  gameWidth: number = 0;
  gameHeight: number = 0;

  get center() {
    return {
      x: this.viewX + this.viewWidth / 2,
      y: this.viewY + this.viewHeight / 2,
    };
  }

  constructor(private width: number, private height: number) {
    this.scale = 1;
  }

  get viewXSlop(): number {
    const x = this.x - this.viewSlop;
    return x;
  }

  get viewYSlop(): number {
    const y = this.y - this.viewSlop;
    return y;
  }

  get viewWidthSlop(): number {
    return (this.width + this.viewSlop * 2) / this.scale;
  }

  get viewHeightSlop(): number {
    return (this.height + this.viewSlop * 2) / this.scale;
  }

  get viewX(): number {
    return this.x;
  }

  get viewY(): number {
    return this.y;
  }

  get viewWidth(): number {
    return this.width / this.scale;
  }

  get viewHeight(): number {
    return this.height / this.scale;
  }

  get viewBox() {
    const vx = this.viewX;
    const vy = this.viewY;
    const vwidth = this.viewWidth;
    const vheight = this.viewHeight;
    return {
      x: vx,
      y: vy,
      width: vwidth,
      height: vheight,
    };
  }
  get outerViewBox() {
    const vx = this.viewXSlop;
    const vy = this.viewYSlop;
    const vwidth = this.viewWidthSlop;
    const vheight = this.viewHeightSlop;
    return {
      x: vx,
      y: vy,
      width: vwidth,
      height: vheight,
    };
  }

  private viewSlop = 100;

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.clamp();
  }

  offsetPosition(x: number, y: number) {
    this.setPosition(this.x + x, this.y + y);
  }

  private clamp() {
    return;
    const gutter = 0.2;
    const reverseGutter = 1 - gutter;

    if (this.x < -this.width * gutter) {
      this.x = -this.width * gutter;
    }
    if (this.y < -this.height * gutter) {
      this.y = -this.height * gutter;
    }

    if (this.x > this.gameWidth - this.width * reverseGutter) {
      this.x = this.gameWidth - this.width * reverseGutter;
    }

    if (this.y > this.gameHeight - this.height * reverseGutter) {
      this.y = this.gameHeight - this.height * reverseGutter;
    }
  }

  setBounds(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.clamp();
  }

  zoom(scale: number) {
    AnimationUtils.start({
      start: this.scale,
      finish: scale,
      duration: 250,
      easing: AnimationUtils.easings.easeInCubic,
      callback: (c) => {
        this.setScale(c);
      },
    });
  }

  moveToPoint(x: number, y: number) {
    const startX = this.x;
    const endX = this.x + (x - (this.x + this.width / 2));

    const startY = this.y;
    const endY = this.y + (y - (this.y + this.height / 2));

    AnimationUtils.start({
      start: 0,
      finish: 1,
      duration: 250,
      easing: AnimationUtils.easings.easeInCubic,
      callback: (c) => {
        this.setPosition(AnimationUtils.lerp(startX, endX, c), AnimationUtils.lerp(startY, endY, c));
      },
    });
  }

  setScale(scale: number) {
    const center = this.center;
    this.scale = scale;
    console.log(center.x);
    this.x = center.x - this.viewWidth / 2;
    this.y = center.y - this.viewHeight / 2;
  }

  transformPoint(p: number) {
    return p / this.scale;
  }

  setCenterPosition(x: number, y: number) {
    this.setPosition(x - this.width / 2, y - this.height / 2);
  }

  contains(entity: {x: number; y: number}) {
    const outer = this.outerViewBox;
    return (
      outer.x < entity.x && outer.x + outer.width > entity.x && outer.y < entity.y && outer.y + outer.height > entity.y
    );
  }
}
