export class CanvasUtils {
  static circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    context.beginPath();
    context.arc(x, y, Math.max(radius, 0), 0, 2 * Math.PI);
  }
  static rect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    context.beginPath();
    context.rect(x, y, width, height);
  }

  static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: boolean,
    stroke: boolean
  ) {
    const cornerRadius = {tl: radius, tr: radius, br: radius, bl: radius};
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius.tl, y);
    ctx.lineTo(x + width - cornerRadius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.tr);
    ctx.lineTo(x + width, y + height - cornerRadius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.br, y + height);
    ctx.lineTo(x + cornerRadius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.bl);
    ctx.lineTo(x, y + cornerRadius.tl);
    ctx.quadraticCurveTo(x, y, x + cornerRadius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }
}
