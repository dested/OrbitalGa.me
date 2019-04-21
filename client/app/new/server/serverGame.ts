import {EnemyEntity} from '../base/entities/enemyEntity';
import {ShotEntity} from '../base/entities/shotEntity';
import {Game} from '../base/game';
import {WorldState} from '../base/types';
import {Socket} from '../socket';
import {Utils} from '../utils/utils';

export class ServerGame extends Game {
  private lastResyncTick: number;

  tick(timeSinceLastTick: number) {
    const currentServerTick = this.currentServerTick;

    for (const playerEntity of this.playerEntities) {
      playerEntity.lastDownAction = {};
    }

    for (const action of this.unprocessedActions) {
      const entity = this.playerEntities.find(a => a.id === action.entityId);
      if (entity) {
        if (entity.handleAction(action, currentServerTick)) {
          for (const otherClient of this.playerEntities) {
            if (entity.id !== otherClient.id) {
              Socket.sendToClient(otherClient.id, {action, messageType: 'action'});
            }
          }
        }
      }
    }

    this.unprocessedActions.length = 0;

    if (currentServerTick / 10000 > this.nonPlayerEntities.filter(a => a instanceof EnemyEntity).length) {
      this.addEntity(
        new EnemyEntity(this, {
          x: parseInt((Math.random() * 500).toFixed()),
          y: parseInt((Math.random() * 500).toFixed()),
          color: 'green',
          health: 10,
          type: 'enemy',
          id: Utils.generateId(),
        })
      );
    }

    const tickSplit = timeSinceLastTick / 5;
    for (let t = tickSplit; t <= timeSinceLastTick; t += tickSplit) {
      for (let i = this.entities.length - 1; i >= 0; i--) {
        const entity = this.entities[i];
        entity.tick(tickSplit, currentServerTick - timeSinceLastTick + t);
        entity.updatePolygon();
      }
      this.checkCollisions();
    }
    this.sendWorldState();
  }

  getWorldState(resync: boolean): WorldState {
    return {
      entities: this.entities.filter(a => !(a instanceof ShotEntity)).map(c => c.serialize()),
      currentTick: this.currentServerTick,
      resync,
    };
  }

  sendWorldState() {
    // let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
    const shouldResync = false;
    if (shouldResync) {
      this.lastResyncTick = this.currentServerTick;
    }
    const worldState = this.getWorldState(shouldResync);
    // console.log(worldState);
    for (const client of this.playerEntities) {
      Socket.sendToClient(client.id, {messageType: 'worldState', state: worldState});
    }
  }

  debugDraw(context: CanvasRenderingContext2D) {
    context.fillText((Math.round(this.currentServerTick / 100) * 100).toFixed(0), 400, 20);
    for (const entity of this.entities) {
      entity.draw(context);
    }
  }
}
