export interface ClientEntity {
  zIndex: DrawZIndex;
  draw(context: CanvasRenderingContext2D): void;
}

export enum DrawZIndex {
  Ordinance = -50,
  Player = 50,
  Scenery = 100,
  Effect = 200,
}
