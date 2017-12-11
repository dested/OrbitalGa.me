import {Game} from "../base/game";
import {Socket} from "../socket";
import {WorldState} from "../base/types";
import {EnemyEntity} from "../base/entity";
import {Utils} from "../utils/utils";

export class ServerGame extends Game {
    private lastResyncTick: number;


    tick(timeSinceLastTick: number) {
        let currentServerTick = this.currentServerTick;


        for (let i = 0; i < this.unprocessedActions.length; i++) {
            let action = this.unprocessedActions[i];
            let entity = this.playerEntities.find(a => a.id === action.entityId);
            if (entity) {
                if (entity.handleAction(action, currentServerTick)) {
                    for (let otherClient of this.playerEntities) {
                        if (entity.id !== otherClient.id) {
                            Socket.sendToClient(otherClient.id, {action: action, messageType: 'action'})
                        }
                    }
                }
            }
        }

        this.unprocessedActions.length = 0;

        if (currentServerTick / 10000 > this.nonPlayerEntities.filter(a => a instanceof EnemyEntity).length) {
            this.addEntity(new EnemyEntity(this, {
                x: parseInt((Math.random() * 500).toFixed()),
                y: parseInt((Math.random() * 500).toFixed()),
                color: 'green',
                health: 10,
                type: 'enemy',
                id: Utils.generateId()
            }))
        }

        let tickSplit = timeSinceLastTick / 5;
        for (let t = tickSplit; t <= timeSinceLastTick; t += tickSplit) {
            for (let i = 0; i < this.entities.length; i++) {
                let entity = this.entities[i];
                entity.tick(tickSplit, currentServerTick - timeSinceLastTick + t);
                entity.updatePolygon();
            }
            this.checkCollisions();
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
