import {WebSocket} from 'ws';
import {Player} from "@common/player";
import {Message} from "@common/messages";

export class ServerPlayer extends Player {
    constructor(private socket: WebSocket) {
        super();
        this.live = false;
    }

    sendMessage(message: Message) {
        this.socket.send(JSON.stringify(message));
    }

    setStartX(x: number) {
        this.moveActions.push({moving: "start", time: 0, position: x});
    }

    live: boolean;

    getActions() {
        return this.moveActions;
    }
}