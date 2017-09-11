import {Player} from "./player";


export abstract class Board {
    width: number;
    currentY: number;
    players: Player[] = [];
    bullets: Bullet[] = [];

    removePlayer(player: Player) {
        this.players.splice(this.players.indexOf(player), 1);
    }

}

export class Bullet {
    constructor(x: number, y: number, velocity: number) {
        this.x = x;
        this.y = y;

        this.velocity = velocity;
        this.startY = y;
        this.fireStart = +new Date();
    }

    x: number;
    y: number;

    startY: number;
    velocity: number;
    fireStart: number;
}
