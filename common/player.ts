import {Config} from "./config";

export class Player {
    playerName: string;
    x: number;
    health: number;
    holdingLeft: boolean;
    holdingRight: boolean;
    playerHorizontalMoveSpeed: number = Config.horizontalMoveSpeed;
    playerVerticalMoveSpeed: number = Config.verticalMoveSpeed;
}