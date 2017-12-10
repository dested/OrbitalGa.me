import {Socket, WorldState} from "../socket";
import {Game} from "../base/game";

export class ServerGame extends Game {
    private lastResyncTick: number;


    tick(timeSinceLastTick: number) {
        for (let i = 0; i < this.unprocessedActions.length; i++) {
            let action = this.unprocessedActions[i];
            let entity = this.playerEntities.find(a => a.id === action.entityId);
            if (entity) {
                if (entity.handleAction(action)) {
                    for (let otherClient of this.playerEntities) {
                        if (entity.id !== otherClient.id) {
                            Socket.sendToClient(otherClient.id, {action: action, messageType: 'action'})
                        }
                    }
                }
            }
        }

        this.unprocessedActions.length = 0;

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
        }
        this.sendWorldState();
    }

    getWorldState(resync: boolean): WorldState {
        return {
            entities: this.entities.map(c => c.serialize()),
            currentTick: this.currentServerTick,
            resync: resync
        }
    }

    sendWorldState() {
        // let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
        let shouldResync = false;
        if (shouldResync) {
            this.lastResyncTick = this.currentServerTick;
        }
        for (let client of this.playerEntities) {
            Socket.sendToClient(client.id, {messageType: 'worldState', state: this.getWorldState(shouldResync)})
        }
    }

    debugDraw(context: CanvasRenderingContext2D) {
        context.fillText((Math.round(this.currentServerTick / 100) * 100).toFixed(0), 400, 20);
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw(context);
        }
    }
}
