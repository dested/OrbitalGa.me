import {EnemyEntity} from '../base/entities/enemyEntity';
import {LivePlayerEntity} from '../base/entities/livePlayerEntity';
import {PlayerEntity} from '../base/entities/playerEntity';
import {ShotEntity} from '../base/entities/shotEntity';
import {Game} from '../base/game';
import {Action, ServerMessage, WorldState} from '../base/types';
import {Socket, SocketClient} from '../socket';

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
      entity.tick(timeSinceLastTick, +new Date() - this.lastServerTick, this.currentServerTick);
      entity.updatePolygon();
    }
    this.checkCollisions();
  }

  lockTick() {
    if (this.liveEntity) {
      this.liveEntity.serverTick(this.currentServerTick);
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
    this.serverTick = state.serverTick;
    this.offsetTick = +new Date();
    for (const stateEntity of state.entities) {
      let entity = this.entities.find(a => a.id === stateEntity.id);
      switch (stateEntity.type) {
        case 'player': {
          if (!entity) {
            if (myEntityId === stateEntity.id) {
              entity = new LivePlayerEntity(this, stateEntity);
            } else {
              entity = new PlayerEntity(this, stateEntity);
            }
            this.entities.push(entity);
          }
          // todo if live then interpolate
          if (entity instanceof LivePlayerEntity) {
          } else {
            (entity as PlayerEntity).bufferedActions = stateEntity.bufferedActions;
          }
          break;
        }
        case 'shot': {
          if (!entity) {
            entity = new ShotEntity(this, stateEntity);
            this.entities.push(entity);
          }
          break;
        }
        case 'enemy': {
          if (!entity) {
            entity = new EnemyEntity(this, stateEntity);
            this.entities.push(entity);
          }
          break;
        }
      }
      if (entity) {
        if (state.resync) {
          entity.x = stateEntity.x;
          entity.y = stateEntity.y;
        }
      }
    }

    const entities = this.entities.filter(a => !(a instanceof ShotEntity));
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (!state.entities.find(a => a.id === entity.id)) {
        this.entities.splice(i, 1);
      }
    }
  }

  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = 'white';
    if (this.liveEntity) {
      context.fillText(this.liveEntity.id.toString(), 0, 20);
      context.fillText(this.currentServerTick.toString(), 400, 20);
    }
    for (const entity of this.entities) {
      entity.draw(context);
    }
  }
}
