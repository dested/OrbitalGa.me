import {Config} from "./config";

export type PlayerDirection = "left" | "right" | "none";

export class Player {
    playerId: string;
    shipType: string;
    playerName: string;
    x: number;
    health: number;
    moving: PlayerDirection;
    movingStart?: number | null;
    movingStartX?: number | null;

    playerHorizontalMoveSpeed: number = Config.horizontalMoveSpeed;
    playerVerticalMoveSpeed: number = Config.verticalMoveSpeed;
}