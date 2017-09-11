import {ServerPlayer} from "./serverPlayer";
import {Message, MessageType, SyncMessage} from "@common/messages";
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


    processMessage(player: ServerPlayer, message: Message) {

        switch (message.type) {
            case MessageType.PlayerStart:
                this.startPlayer(player, message.playerName);
                break;
            case MessageType.Move:
                player.updateMoving(message.moving, message.time);
                break;
            case MessageType.Attack:
                player.updateAttack(message.attackType, message.time);
                break;
        }

        switch (message.type) {
            case MessageType.Move:
            case MessageType.Attack:
                this.broadcast(message, player);
                break;
        }
    }

    private lastFullSync: number = 0;

    tick() {
        if (ServerTimeUtils.getNow() - this.lastFullSync > 3000) {
            this.lastFullSync = ServerTimeUtils.getNow();
            this.broadcast({
                type: MessageType.SyncPlayer,
                data: this.buildSyncMessage(null),
                time: ServerTimeUtils.getNow()
            });
        }
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