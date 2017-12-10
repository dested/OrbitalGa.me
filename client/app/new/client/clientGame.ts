import {LivePlayerEntity, PlayerEntity, ShotEntity} from "../base/entity";
import {Game} from "../base/game";
import {Action, ServerMessage, Socket, SocketClient, WorldState} from "../socket";

export class ClientGame extends Game {
    socketClient: SocketClient;

    get liveEntity(): LivePlayerEntity {
        return this.entities.find(a => a instanceof LivePlayerEntity) as LivePlayerEntity;
    }

    unprocessedActions: Action[] = [];

    get currentServerTick() {
        return this.serverTick + (+new Date() - this.offsetTick);
    }

    sendAction(action: Action) {
        this.socketClient.sendToServer({messageType: 'action', action});
    }

    onConnection(serverTick: number) {
        this.serverTick = serverTick;
        this.offsetTick = +new Date();
    }

    join() {
        this.socketClient = Socket.clientJoin((message) => {
            this.onServerMessage(message);
        })
    }

    private onServerMessage(message: ServerMessage) {
        switch (message.messageType) {
            case "start":
                this.onConnection(message.serverTick);
                this.setServerState(message.state, message.yourEntityId);
                break;
            case "worldState":
                this.setServerState(message.state);
                break;
            case "action":
                this.unprocessedActions.push(message.action);
                break;
        }
    }

    private setServerState(state: WorldState, myEntityId?: string) {
        for (let i = 0; i < state.entities.length; i++) {
            let entity = state.entities[i];
            let liveEntity = this.entities.find(a => a.id === entity.id);

            switch (entity.type) {
                case "player": {
                    if (!liveEntity) {
                        if (myEntityId === entity.id) {
                            liveEntity = new LivePlayerEntity(this, {tickCreated: 0, x: entity.x, y: entity.y});
                        } else {
                            liveEntity = new PlayerEntity(this, {tickCreated: 0, x: entity.x, y: entity.y});
                        }
                        liveEntity.id = entity.id;
                        this.entities.push(liveEntity)
                    }
                    (liveEntity as PlayerEntity).lastDownAction = entity.lastDownAction;
                    (liveEntity as PlayerEntity).color = entity.color;
                    break;
                }
                case "shot": {
                    if (!liveEntity) {
                        liveEntity = new ShotEntity(this, {
                            tickCreated: entity.tickCreated,
                            ownerId: entity.ownerId,
                            x: entity.x,
                            y: entity.y
                        }, entity.initialY);
                        liveEntity.id = entity.id;
                        this.entities.push(liveEntity)
                    }
                    break;
                }
            }
            if (liveEntity) {
                if (state.resync) {
                    liveEntity.x = entity.x;
                    liveEntity.y = entity.y;
                }
            }
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
            let entity = this.entities[i];
            if (!state.entities.find(a => a.id === entity.id)) {
                this.entities.splice(i, 1);
            }
        }
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = 'white';
        if (this.liveEntity) {
            context.fillText(this.liveEntity.id.toString(), 0, 20);
            context.fillText((Math.round(this.currentServerTick / 100) * 100).toFixed(0), 400, 20);
        }
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw(context);
        }
    }
}
