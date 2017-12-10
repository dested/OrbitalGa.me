import {ServerGame} from "./serverGame";
import {PlayerEntity} from "../base/entity";
import {Socket} from "../socket";

export class Server {

    game: ServerGame;


    constructor() {
        this.game = new ServerGame();
        Socket.createServer((clientId, message) => {
            if (message.messageType === 'action') {
                this.game.unprocessedActions.push(message.action);
            }
        }, (client) => {
            let newPlayer = new PlayerEntity(this.game,
                {
                    tickCreated: this.game.currentServerTick,
                    x: parseInt((Math.random() * 500).toFixed()),
                    y: parseInt((Math.random() * 500).toFixed())
                }
            );
            newPlayer.id = client.id;
            newPlayer.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
            this.game.entities.push(newPlayer);
            Socket.sendToClient(client.id, {
                messageType: "start",
                yourEntityId: client.id,
                serverTick: this.game.currentServerTick,
                state: this.game.getWorldState(true)
            });

            for (let player of this.game.playerEntities) {
                if (player !== newPlayer) {
                    Socket.sendToClient(client.id, {messageType: 'worldState', state: this.game.getWorldState(true)})
                }
            }

        });

        setInterval(() => {
            let curTick = +new Date();
            this.game.tick(curTick - this.lastTick);
            this.lastTick = curTick;
        }, 100);
    }

    lastTick = +new Date();
}
