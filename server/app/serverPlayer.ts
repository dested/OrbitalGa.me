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

    live: boolean;
}