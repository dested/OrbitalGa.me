import {AnimationUtils} from '@common/utils/animationUtils';

export class GameView {
  gameHeight: number = 0;

  gameWidth: number = 0;

  scale: number;

  private _center: {x: number; y: number} = {x: 0, y: 0};
  private _outerViewBox: {height: number; width: number; x: number; y: number} = {x: 0, y: 0, width: 0, height: 0};

  private _viewBox: {height: number; width: number; x: number; y: number} = {x: 0, y: 0, width: 0, height: 0};

  private viewSlop = 100;
  private x: number = 0;
  private y: number = 0;

  constructor(private width: number, private height: number) {
    this.scale = 1;
  }
  get center() {
    this._center.x = this.viewX + this.viewWidth / 2;
    this._center.y = this.viewY + this.viewHeight / 2;
    return this._center;
  }

  get outerViewBox() {
    this._outerViewBox.x = this.viewXSlop;
    this._outerViewBox.y = this.viewYSlop;
    this._outerViewBox.width = this.viewWidthSlop;
    this._outerViewBox.height = this.viewHeightSlop;
    return this._outerViewBox;
  }
  get viewBox() {
    this._viewBox.x = this.viewX;
    this._viewBox.y = this.viewY;
    this._viewBox.width = this.viewWidth;
    this._viewBox.height = this.viewHeight;
    return this._viewBox;
  }

  get viewHeight(): number {
    return this.height / this.scale;
  }

  get viewHeightSlop(): number {
    return (this.height + this.viewSlop * 2) / this.scale;
  }

  get viewWidth(): number {
    return this.width / this.scale;
  }

  get viewWidthSlop(): number {
    return (this.width + this.viewSlop * 2) / this.scale;
  }

  get viewX(): number {
    return this.x;
  }

  get viewXSlop(): number {
    const x = this.x - this.viewSlop;
    return x;
  }

  get viewY(): number {
    return this.y;
  }

  get viewYSlop(): number {
    const y = this.y - this.viewSlop;
    return y;
  }

  contains(x: number, y: number) {
    const outer = this.outerViewBox;

    return outer.x < x && outer.x + outer.width > x && outer.y < y && outer.y + outer.height > y;
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

  offsetPosition(x: number, y: number) {
    this.setPosition(this.x + x, this.y + y);
  }

  setBounds(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.clamp();
  }

  setCenterPosition(x: number, y: number) {
    this.setPosition(x - this.width / 2, y - this.height / 2);
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.clamp();
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
}
