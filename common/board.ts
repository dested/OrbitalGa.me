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

    playerHoldingLeft(player: Player, isHolding: boolean) {
        player.holdingRight = false;
        player.holdingLeft = isHolding;
    }

    playerHoldingRight(player: Player, isHolding: boolean) {
        player.holdingLeft = false;
        player.holdingRight = isHolding;
    }

    scheduledMessages: { [tick: number]: { message: Message, player: Player }[] } = {};

    scheduleMessage({tick, message, player}: { tick: number, message: Message, player: Player }) {
        let scheduled = this.scheduledMessages[tick];
        if (!scheduled) {
            scheduled = this.scheduledMessages[tick] = [];
        }
        scheduled.push({message, player});
    }

    tick() {
        this.currentTick++;
        let messages = this.scheduledMessages[this.currentTick];
        if (messages) {
            for (let message of messages) {
                this.executeMessage(message.player, message.message);
            }
            delete this.scheduledMessages[this.currentTick];
        }

        for (let player of this.players) {
            if (player.holdingLeft) {
                player.x -= Config.horizontalMoveSpeed;
            }
            if (player.holdingRight) {
                player.x += Config.horizontalMoveSpeed;
            }
        }
    }


    executeMessage(player: Player, message: Message) {
        console.log('executing message',player.playerName,message)
        switch (message.type) {
            case MessageType.PlayerStart:
                this.startPlayer(player, message.playerName);
                break;
            case MessageType.MoveLeftStart:
                this.playerHoldingLeft(player, true);
                break;
            case MessageType.MoveLeftStop:
                this.playerHoldingLeft(player, false);
                break;
            case MessageType.MoveRightStart:
                this.playerHoldingRight(player, true);
                break;
            case MessageType.MoveRightStop:
                this.playerHoldingRight(player, false);
                break;
        }
    }


}
