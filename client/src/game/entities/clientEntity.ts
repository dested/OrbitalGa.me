export interface ClientEntity {
  drawX: number;
  drawY: number;
  zIndex: DrawZIndex;
  draw(context: CanvasRenderingContext2D): void;
  tick(duration: number): void;
}

export enum DrawZIndex {
  Ordinance = -50,
  Player = 50,
  Scenery = 100,
  Effect = 200,
}
