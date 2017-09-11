import {ServerPlayer} from "./serverPlayer";
import {AttackMessage, Message, MessageType, MessageUtils, MoveMessage, SyncMessage} from "@common/messages";
import {Board} from "@common/board";
import {Player} from "@common/player";

export class ServerBoard extends Board {
    players: ServerPlayer[];

    startPlayer(player: ServerPlayer, playerName: string) {
        player.playerId = (Math.random() * 10000000).toFixed();
        player.playerName = playerName;
        player.shipType = this.pickShip();
        player.setStartX((Math.random() * this.width) | 0);
        player.health = 100;
        player.sendMessage({
            type: MessageType.GameStart,
            data: this.buildSyncMessage(player),
            time: ServerTimeUtils.getNow(),
        });
        this.broadcast({
            type: MessageType.SyncPlayer,
            data: this.buildSyncMessage(null),
            time: ServerTimeUtils.getNow(),
        }, player);

    }


    private playerAttack(player: Player, message: AttackMessage) {
        console.log('processing player attack', message)
        /*
            server sends client start time
            all information happens relative to that
            bullets position and existence are based on creation and duration from start time

            lerp between reality and start time
         */
    }

    processMessage(player: ServerPlayer, message: Message) {

        switch (message.type) {
            case MessageType.PlayerStart:
                this.startPlayer(player, message.playerName);
                break;
            case MessageType.Move:
                player.updateMoving(message.moving, message.time);
                break;
            case MessageType.Attack:
                this.playerAttack(player, message);
                break;
        }

        switch (message.type) {
            case MessageType.Move:
            case MessageType.Attack:
                this.broadcast(message, player);
                break;
        }
    }

    tick() {
        /*
                if (TimeUtils.getNow().time%3000 === 0) {
                    this.broadcast({
                        type: MessageType.SyncPlayer,
                        data: this.buildSyncMessage(null)
                    })
                }
        */
    }

    buildSyncMessage(me: ServerPlayer | null): SyncMessage {
        return {
            players: this.players.map(p => ({
                me: me === p,
                x: p.x,
                playerId: p.playerId,
                shipType: p.shipType,
                playerName: p.playerName,
                actions: p.getActions()
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

export class ServerTimeUtils {
    static startTime: number;

    static getNow(): number {
        return +new Date() - this.startTime;
    }

    static start() {
        this.startTime = +new Date();
    }
}