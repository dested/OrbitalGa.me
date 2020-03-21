import {EnemyEntity} from '../base/entities/enemyEntity';
import {PlayerEntity} from '../base/entities/playerEntity';
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

    if (this.serverTick % 100 === 1) {
      this.addEntity(
        new EnemyEntity(this, {
          x: parseInt((Math.random() * 400).toFixed())+50,
          y: parseInt((Math.random() * 400).toFixed())+50,
          color: 'green',
          health: 10,
          type: 'enemy',
          id: Utils.generateId(),
          isClient: false,
        })
      );
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.serverTick(this.serverTick);
      entity.updatePolygon();
    }
    this.checkCollisions(false);
    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (this.entities[i].willDestroy) {
        this.entities[i].destroy();
      }
    }
    this.sendWorldState();
  }

  getWorldState(resync: boolean): WorldState {
    if (resync) {
      return {
        entities: this.entities
          .filter(a => a instanceof PlayerEntity || a instanceof EnemyEntity)
          .map(c => c.serialize()),
        serverTick: this.serverTick,
        resync: true,
      };
    } else {
      return {
        entities: this.entities
          .filter(a => a instanceof PlayerEntity || a instanceof EnemyEntity)
          .map(c => c.serializeLight()),
        serverTick: this.serverTick,
        resync: false,
      };
    }
  }

  sendWorldState() {
    // let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
    const worldState = this.getWorldState(true);
    // console.log(worldState);
    for (const client of this.playerEntities) {
      Socket.sendToClient(client.id, {messageType: 'worldState', state: worldState});
    }
  }

  debugDraw(context: CanvasRenderingContext2D) {
    context.fillStyle = 'white';
    context.fillText(this.serverTick.toString(), 400, 20);
    context.fillText(this.entities.length.toString(), 400, 50);
    for (const entity of this.entities) {
      entity.draw(context);
    }
  }
}
