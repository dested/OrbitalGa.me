import {Player} from "./player";

export abstract class Board {
    width: number;
    currentY: number;
    currentTick: number;
    players: Player[];

    removePlayer(player: Player) {
        this.players.splice(this.players.indexOf(player), 1);
    }

    tick() {
        this.currentTick++;
    }
}
