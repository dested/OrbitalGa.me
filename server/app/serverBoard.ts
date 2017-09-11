import {ServerPlayer} from "./serverPlayer";
import {Board} from "@common/board";
import {Config} from "@common/config";
import {Message, MessageType, MessageUtils, MoveMessage, SyncMessage, TickMessage} from "@common/messages";
import {Player} from "@common/player";

export class ServerBoard extends Board {
    players: ServerPlayer[];

    startPlayer(player: ServerPlayer, playerName: string) {
        player.playerId = (Math.random() * 10000000).toFixed();
        player.playerName = playerName;
        player.shipType = this.pickShip();
        player.x = (Math.random() * this.width) | 0;
        player.health = 100;
        player.moving = "none";
        player.sendMessage({
            type: MessageType.GameStart,
            tick: this.currentTick,
            data: this.buildSyncMessage(player)
        });
        this.broadcast({
            type: MessageType.SyncPlayer,
            tick: this.currentTick,
            data: this.buildSyncMessage(null)
        }, player);

    }


    executeMessage(player: ServerPlayer, message: Message) {
        switch (message.type) {
            case MessageType.PlayerStart:
                this.startPlayer(player, message.playerName);
                break;
            case MessageType.Move:
                this.playerMove(player, message);
                break;
        }
    }

    private playerMove(player: Player, message: MoveMessage) {
        console.log('processing player move', message)
        if (player.moving === "none") {
            player.movingStartX = player.x;
            player.moving = message.moving;
            player.movingStart = +new Date();
        } else if (message.moving === "none") {
            // let msDuration = player.movingStart! + message.duration;
            let distance = Config.horizontalMoveSpeed * (Config.ticksPerSecond / (1000 / message.duration));
            player.x = player.movingStartX! + (distance * (player.moving === "left" ? -1 : 1));
            console.log(message.x, player.x, message.duration, distance);
            player.moving = "none";
        } else if (message.moving !== player.moving) {
            // let msDuration = player.movingStart! + message.duration;
            let distance = Config.horizontalMoveSpeed * (Config.ticksPerSecond / (1000 / message.duration));
            player.x = player.movingStartX! + (distance * (player.moving === "left" ? -1 : 1));
            console.log(message.x, player.x, message.duration, distance);
            player.movingStartX = player.x;
            player.moving = message.moving;
            player.movingStart = +new Date();
        }
    }

    processMessage(player: ServerPlayer, message: Message) {

        this.executeMessage(player, message);
        switch (message.type) {
            case MessageType.Move:
                this.broadcast(message, player);
                break;
        }
    }

    tick() {
        super.tick();
        if (this.currentTick % Config.ticksPerSecond * 2 === 0) {
            this.broadcast({
                type: MessageType.SyncPlayer,
                tick: this.currentTick,
                data: this.buildSyncMessage(null)
            })
        }
    }

    buildSyncMessage(me: ServerPlayer | null): SyncMessage {
        return {
            players: this.players.map(p => ({
                me: me === p,
                x: p.x,
                playerId: p.playerId,
                shipType: p.shipType,
                moving: p.moving,
                playerName: p.playerName
            }))
        }
    }

    private broadcast(message: Message, exceptPlayer: Player | null = null) {
        for (let player of this.players) {
            if (exceptPlayer === player) continue;
            player.sendMessage(message);
        }
    }

    private pickShip() {
        let r = Math.random();
        if (r < .50) {
            return "ship1";
        } else {
            return "ship2";
        }
    }

}
