import {ServerPlayer} from "./serverPlayer";
import {Board} from "@common/board";
import {Config} from "@common/config";
import {Message, MessageType, SyncMessage, TickMessage} from "@common/messages";
import {Player} from "@common/player";

export class ServerBoard extends Board {
    players: ServerPlayer[];

    startPlayer(player: ServerPlayer, playerName: string) {
        player.playerName = playerName;
        player.x = (Math.random() * this.width) | 0;
        player.health = 100;
    }

    syncPlayer(player: ServerPlayer) {
        player.sendMessage({
            type: MessageType.SyncPlayer,
            tick: this.currentTick,
            data: this.buildSyncMessage()
        });
    }

    processMessage(player: ServerPlayer, message: Message) {
        let tick = (<TickMessage>message).tick;
        if (tick) {
            if (this.currentTick - tick > Config.ticksPerSecond) {
                this.syncPlayer(player);
            }
            else if (tick - this.currentTick > 2) {
                this.syncPlayer(player);
            } else {
                this.scheduleMessage({tick, message, player})
            }
        } else {
            this.executeMessage(player, message);
        }
    }

    tick() {
        super.tick();
        if (this.currentTick % Config.ticksPerSecond * 2 === 0) {
            this.broadcast({
                type: MessageType.SyncPlayer,
                tick: this.currentTick,
                data: this.buildSyncMessage()
            })
        }
    }

    buildSyncMessage(): SyncMessage {
        return {
            players: this.players.map(p => ({
                x: p.x,
                holdingLeft: p.holdingLeft,
                holdingRight: p.holdingRight,
            }))
        }
    }

    private broadcast(message: Message) {
        for (let player of this.players) {
            player.sendMessage(message);
        }
    }
}
