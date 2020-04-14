import {Asset} from './assetManager';

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

  static whiteVersion(asset: Asset) {
    const canvas = document.createElement('canvas');
    canvas.width = asset.size.width;
    canvas.height = asset.size.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(asset.image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const a = imageData.data[i + 3];
      if (a !== 0) {
        imageData.data[i] = imageData.data[i];
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
      }
    }
    context.putImageData(imageData, 0, 0);
    return canvas;
  }
}
