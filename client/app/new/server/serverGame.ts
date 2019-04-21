import {EnemyEntity} from '../base/entities/enemyEntity';
import {ShotEntity} from '../base/entities/shotEntity';
import {Game} from '../base/game';
import {Action, WorldState} from '../base/types';
import {Socket} from '../socket';
import {Utils} from '../utils/utils';

export class ServerGame extends Game {
  serverTick: number = 0;
  unprocessedActions: Action[] = [];
  lockTick() {
    this.serverTick++;

    for (const action of this.unprocessedActions) {
      const entity = this.playerEntities.find(a => a.id === action.entityId);
      if (entity) {
        // todo validate tick is not more than 1 tick int eh past
        entity.addAction(action);
      }
    }

    this.unprocessedActions.length = 0;

    /*
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
*/

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.serverTick(this.serverTick);
      entity.updatePolygon();
      this.checkCollisions();
    }
    this.sendWorldState();
  }

  getWorldState(resync: boolean): WorldState {
    return {
      entities: this.entities.map(c => c.serialize()),
      serverTick: this.serverTick,
      resync,
    };
  }

  sendWorldState() {
    // let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
    const worldState = this.getWorldState(false);
    // console.log(worldState);
    for (const client of this.playerEntities) {
      Socket.sendToClient(client.id, {messageType: 'worldState', state: worldState});
    }
  }

  debugDraw(context: CanvasRenderingContext2D) {
    context.fillText(this.serverTick.toString(), 400, 20);
    for (const entity of this.entities) {
      entity.draw(context);
    }
  }
}
