export class CanvasInformation {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.canvas = context.canvas as HTMLCanvasElement;
  }

  static create(w: number, h: number): CanvasInformation {
    const canvas = document.createElement('canvas');
    return CanvasInformation.CreateFromElement(canvas, w, h);
  }

  static CreateFromElement(canvas: HTMLCanvasElement, w: number, h: number): CanvasInformation {
    if (w == 0) {
      w = 1;
    }
    if (h == 0) {
      h = 1;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return new CanvasInformation(ctx);
  }
}
