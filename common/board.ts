import {Player} from "./player";
import {Message, MessageType} from "./messages";
import {Config} from "./config";

export abstract class Board {
    width: number;
    currentY: number;
    currentTick: number;
    players: Player[];

    startPlayer(player: Player, playerName: string): void {
        throw new Error("Method not implemented.");
    }

    removePlayer(player: Player) {
        this.players.splice(this.players.indexOf(player), 1);
    }

    playerMove(player: Player, moving: "left" | "right" | "none") {
        player.moving = moving;
    }


    tick() {
        this.currentTick++;

        for (let player of this.players) {
            if (player.moving === "left") {
                player.x -= Config.horizontalMoveSpeed;
            }
            if (player.moving === "right") {
                player.x += Config.horizontalMoveSpeed;
            }
        }
    }


    executeMessage(player: Player, message: Message) {
        console.log('executing message', player.playerName, message)
        switch (message.type) {
            case MessageType.PlayerStart:
                this.startPlayer(player, message.playerName);
                break;
            case MessageType.Move:
                this.playerMove(player, message.moving);
                break;
        }
    }


}
