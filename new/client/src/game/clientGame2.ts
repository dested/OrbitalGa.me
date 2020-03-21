import {Game} from '../../../common/src/game/game';
import {LivePlayerEntity} from '../../../common/src/game/entities/livePlayerEntity';
import {Action, ServerMessage, WorldState} from '../../../common/src/game/types';
import {PlayerEntity} from '../../../common/src/game/entities/playerEntity';
import {ShotEntity} from '../../../common/src/game/entities/shotEntity';
import {EnemyEntity} from '../../../common/src/game/entities/enemyEntity';


export class ClientGame extends Game {
  socketClient: SocketClient;

  get liveEntity(): LivePlayerEntity {
    return this.entities.find(a => a instanceof LivePlayerEntity) as LivePlayerEntity;
  }

  unprocessedActions: Action[] = [];
  protected lastServerTick: number = 0;
  protected serverTick: number = 0;
  protected offsetTick: number = +new Date();

  get currentServerTick() {
    return this.serverTick + Math.floor((+new Date() - this.offsetTick) / Game.tickRate);
  }

  sendAction(action: Action) {
    this.socketClient.sendToServer({messageType: 'action', action});
  }

  onConnection(serverTick: number) {
    this.serverTick = serverTick;
    this.offsetTick = +new Date();
  }

  join() {
    this.socketClient = Socket.clientJoin(message => {
      this.onServerMessage(message);
    });
  }

  tick(timeSinceLastTick: number) {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.clientDeath) {
        continue;
      }
      entity.tick(timeSinceLastTick, +new Date() - this.lastServerTick, this.currentServerTick);
      entity.updatePolygon();
    }
    this.checkCollisions(true);
  }

  lockTick() {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity) {
        entity.lockTick(this.currentServerTick);
        entity.updatePolygon();
      }
    }
    this.checkCollisions(false);
    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (this.entities[i].willDestroy) {
        this.entities[i].destroy();
      }
    }
  }

  private onServerMessage(message: ServerMessage) {
    switch (message.messageType) {
      case 'start':
        this.onConnection(message.serverTick);
        this.setServerState(message.state, message.yourEntityId);
        break;
      case 'worldState':
        this.setServerState(message.state);
        this.lastServerTick = +new Date();
        break;
      case 'action':
        this.unprocessedActions.push(message.action);
        break;
    }
  }

  private setServerState(state: WorldState, myEntityId?: string) {
    if (state.resync === false) {
      return;
    }
    this.serverTick = state.serverTick;
    this.offsetTick = +new Date();
    for (const stateEntity of state.entities) {
      let entity = this.entities.find(a => a.id === stateEntity.id);
      switch (stateEntity.type) {
        case 'player': {
          if (!entity) {
            if (myEntityId === stateEntity.id) {
              entity = new LivePlayerEntity(this, {...stateEntity, isClient: true});
            } else {
              entity = new PlayerEntity(this, {...stateEntity, isClient: true});
            }
            this.entities.push(entity);
          }
          if (entity instanceof LivePlayerEntity) {
          } else {
            (entity as PlayerEntity).bufferedActions = stateEntity.bufferedActions;
          }
          break;
        }
        case 'shot': {
          if (!entity) {
            entity = new ShotEntity(this, {...stateEntity, isClient: true});
            this.entities.push(entity);
          }
          break;
        }
        case 'enemy': {
          if (!entity) {
            entity = new EnemyEntity(this, {...stateEntity, isClient: true});
            this.entities.push(entity);
          }
          break;
        }
      }
      if (entity) {
        /*
        if (state.resync) {
          entity.x = stateEntity.x;
          entity.y = stateEntity.y;
        }
*/
      }
    }

    const entities = this.entities.filter(a => !(a instanceof ShotEntity));
    for (const entity of this.entities.filter(a => !(a instanceof ShotEntity))) {
      if (!state.entities.find(a => a.id === entity.id)) {
        entity.willDestroy = true;
      }
    }
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (entity.willDestroy) {
        entity.destroy();
      }
    }
  }

  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = 'white';
    if (this.liveEntity) {
      context.fillStyle = 'white';
      context.fillText(this.currentServerTick.toString(), 400, 20);
      context.fillText(this.entities.length.toString(), 400, 50);
    }
    for (const entity of this.entities) {
      if (entity.clientDeath) {
        continue;
      }
      entity.draw(context);
    }
  }
}
