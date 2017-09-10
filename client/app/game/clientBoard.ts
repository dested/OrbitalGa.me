import {Board} from "@common/board";
import {Player} from "@common/player";
import {ClientPlayer} from "./clientPlayer";

export class ClientBoard extends Board {
    players: ClientPlayer[];
    me: ClientPlayer;

    startPlayer(player: Player, playerName: string): void {
        throw new Error("Method not implemented.");
    }

    createMainPlayer() {
        this.me = new ClientPlayer();
        this.me.y = 0;
        this.me.x = 200;
    }

}