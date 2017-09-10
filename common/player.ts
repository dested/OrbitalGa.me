import {Config} from "./config";

export type PlayerDirection = "left" | "right" | "none";

export class Player {
    playerId: string;
    playerName: string;
    x: number;
    health: number;
    moving: PlayerDirection;
    playerHorizontalMoveSpeed: number = Config.horizontalMoveSpeed;
    playerVerticalMoveSpeed: number = Config.verticalMoveSpeed;
}