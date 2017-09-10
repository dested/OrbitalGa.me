import {ServerPlayer} from "./serverPlayer";
import {Board} from "@common/board";
import {Config} from "@common/config";
import {Message, MessageType, MessageUtils, SyncMessage, TickMessage} from "@common/messages";
import {Player} from "@common/player";

export class ServerBoard extends Board {
    players: ServerPlayer[];

    startPlayer(player: ServerPlayer, playerName: string) {
        player.playerId = (Math.random() * 10000000).toFixed();
        player.playerName = playerName;
        player.shipType = this.pickShip();
        player.x = (Math.random() * this.width) | 0;
        player.health = 100;
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

    syncPlayer(player: ServerPlayer) {
        player.sendMessage({
            type: MessageType.SyncPlayer,
            tick: this.currentTick,
            data: this.buildSyncMessage(null)
        });
    }

    processMessage(player: ServerPlayer, message: Message) {
        if (MessageUtils.isTickMessage(message)) {
            if (this.currentTick - message.tick > Config.ticksPerSecond) {
                this.syncPlayer(player);
                return;
            }
            else if (message.tick - this.currentTick > 2) {
                this.syncPlayer(player);
                return;
            } else {
                this.executeMessage(player, message);
            }
        } else {
            this.executeMessage(player, message);
        }
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
