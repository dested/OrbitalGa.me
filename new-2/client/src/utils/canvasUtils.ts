export class CanvasUtils {
  static circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    context.beginPath();
    context.arc(x, y, Math.max(radius, 0), 0, 2 * Math.PI);
  }
  static rect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    context.beginPath();
    context.rect(x, y, width, height);
  }
}
