import {EnemyEntity, LivePlayerEntity, PlayerEntity, ShotEntity} from '../base/entity';
import {Game} from '../base/game';
import {Action, ServerMessage, WorldState} from '../base/types';
import {Socket, SocketClient} from '../socket';

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
    this.socketClient = Socket.clientJoin(message => {
      this.onServerMessage(message);
    });
  }

  private onServerMessage(message: ServerMessage) {
    switch (message.messageType) {
      case 'start':
        this.onConnection(message.serverTick);
        this.setServerState(message.state, message.yourEntityId);
        break;
      case 'worldState':
        this.setServerState(message.state);
        break;
      case 'action':
        this.unprocessedActions.push(message.action);
        break;
    }
  }

  private setServerState(state: WorldState, myEntityId?: string) {
    for (const entity of state.entities) {
      let liveEntity = this.entities.find(a => a.id === entity.id);
      switch (entity.type) {
        case 'player': {
          if (!liveEntity) {
            if (myEntityId === entity.id) {
              liveEntity = new LivePlayerEntity(this, entity);
            } else {
              liveEntity = new PlayerEntity(this, entity);
            }
            this.entities.push(liveEntity);
          }

          (liveEntity as PlayerEntity).lastDownAction = entity.lastDownAction;
          break;
        }
        case 'shot': {
          if (!liveEntity) {
            liveEntity = new ShotEntity(this, entity);
            this.entities.push(liveEntity);
          }
          break;
        }
        case 'enemy': {
          if (!liveEntity) {
            liveEntity = new EnemyEntity(this, entity);
            this.entities.push(liveEntity);
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
      const entity = this.entities[i];
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
    for (const entity of this.entities) {
      entity.draw(context);
    }
  }
}
