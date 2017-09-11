import {Config} from "./config";

export type PlayerDirection = "left" | "right" | "none";
export type AttackType = "bullet" | "bomb";

export class Player {
    playerId: string;
    shipType: string;
    playerName: string;
    x: number;
    health: number;
    moving: PlayerDirection;
    movingStart?: number | null;
    movingStartX?: number | null;

    firingStart?: number | null;
    bulletsFired?: number | null;


    bulletsPerSecond: number = 10;
    bulletVelocity: number=-300;


}