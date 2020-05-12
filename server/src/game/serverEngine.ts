import {unreachable} from '@common/utils/unreachable';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {Engine, Game} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import {ServerPlayerEntity} from './entities/serverPlayerEntity';
import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {EntityModels, ServerToClientMessage} from '@common/models/serverToClientMessages';
import {PlayerEntity} from '@common/entities/playerEntity';
import {ArrayHash} from '@common/utils/arrayHash';
import {Entity} from '@common/baseEntities/entity';
import {RBushXOnly} from '@common/utils/rbushXOnly';
import {ClientToServerMessage} from '@common/models/clientToServerMessages';
import {IServerSync} from './IServerSync';
import {IServerSocket} from '@common/socket/models';
import {Scheduler} from '@common/utils/scheduler';
import {GameLeaderboard} from '@common/game/gameLeaderboard';
import {PhysicsEntity} from '@common/baseEntities/physicsEntity';

type Spectator = {connectionId: number};
type User = {
  connectionId: number;
  deadXY?: {x: number; y: number};
  entity?: ServerPlayerEntity;
  name: string;
};

export abstract class ServerEngine extends Engine {
  gameLeaderboard?: GameLeaderboard;
  queuedMessages: {connectionId: number; message: ClientToServerMessage}[] = [];
  queuedMessagesToSend: {[connectionId: number]: ServerToClientMessage[]} = {};
  spectators = new ArrayHash<Spectator>('connectionId');
  users = new ArrayHash<User>('connectionId');
  private scheduler?: Scheduler;

  constructor(protected serverSocket: IServerSocket, protected serverSync: IServerSync, protected game: Game) {
    super();
    this.gameLeaderboard?.setServerSync(serverSync);
    game.setEngine(this);
    serverSocket.start({
      onJoin: (connectionId) => {
        this.queuedMessagesToSend[connectionId] = [];
      },
      onLeave: (connectionId) => {
        this.userLeave(connectionId);
      },
      onMessage: (connectionId, message) => {
        this.processMessage(connectionId, message);
      },
    });
    if (!GameConstants.isSinglePlayer) {
      serverSync.startServer();
    }
  }

  abstract gameTick(tickIndex: number, duration: number): void;

  init() {
    this.initGame();
    let serverTick = 0;
    let last = +new Date();
    this.scheduler = new Scheduler({
      tick: () => {
        serverTick++;
        this.serverTick(serverTick, +new Date() - last);
        last = +new Date();
      },
      period: GameConstants.serverTickRate,
      delay: GameConstants.serverTickRate / 3,
    }).start();
  }

  abstract initGame(): void;

  killPlayer(player: PlayerEntity): void {
    this.gameLeaderboard?.removePlayer(player.entityId);
    for (const user of this.users.array) {
      if (user.entity === player) {
        user.deadXY = {x: player.position.x, y: player.position.y};
        user.entity = undefined;
        break;
      }
    }
  }

  processInputs() {
    const time = +new Date();
    let stopped = false;
    for (let i = 0; i < this.queuedMessages.length; i++) {
      if (time + 16 < +new Date()) {
        console.log('stopped');
        stopped = true;
        this.queuedMessages.splice(0, i);
        break;
      }
      const q = this.queuedMessages[i];
      switch (q.message.type) {
        case 'join':
          this.userJoin(q.connectionId);
          break;
        case 'spectate':
          this.spectatorJoin(q.connectionId);
          break;
        case 'ping':
          {
            const connection = this.serverSocket.connections.lookup(q.connectionId);
            if (connection) {
              connection.lastPing = +new Date();
            }
            this.sendMessageToClient(q.connectionId, {type: 'pong', ping: q.message.ping});
          }
          break;
        case 'playerInput': {
          const user = this.users.lookup(q.connectionId);
          const connection = this.serverSocket.connections.lookup(q.connectionId);
          if (user && connection && user.entity) {
            connection.lastAction = +new Date();
            this.game.processInput(q.message, user.entity.entityId);
          }
          break;
        }
        default:
          unreachable(q.message);
      }
    }

    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }
  }

  processMessage(connectionId: number, message: ClientToServerMessage) {
    this.queuedMessages.push({connectionId, message});
  }

  sendMessageToClient(connectionId: number, message: ServerToClientMessage) {
    if (this.queuedMessagesToSend[connectionId]) {
      this.queuedMessagesToSend[connectionId].push(message);
    }
  }

  serverTick(tickIndex: number, duration: number) {
    if (!GameConstants.isSinglePlayer) {
      const groupings = this.game.entityClusterer.getGroupings((a) => a.type === 'player');
      const groups = Utils.groupBy(this.game.entities.array, (a) => a.type);
      const memoryUsage = process.memoryUsage();

      this.serverSync.setStat({
        boardWidth: groupings[groupings.length - 1].x1 - groupings[0].x0,
        bytesReceived: this.serverSocket.totalBytesSentPerSecond,
        bytesSent: this.serverSocket.totalBytesSent,
        connections: this.serverSocket.connections.length,
        duration,
        entities: this.game.entities.length,
        users: this.users.length,
        spectators: this.spectators.length,
        entityGroupCount: Utils.safeKeys(groups)
          .map((a) => `${a}: ${groups[a].length}`)
          .join(', '),
        memExternal: memoryUsage.external,
        memHeapTotal: memoryUsage.heapTotal,
        memHeapUsed: memoryUsage.heapUsed,
        messages: this.queuedMessages.length,
        tickIndex,
        totalBytesReceived: this.serverSocket.totalBytesReceived,
        totalBytesSent: this.serverSocket.totalBytesSent,
      });
    }

    this.processInputs();

    this.gameTick(tickIndex, duration);

    if ((tickIndex % 60) * 5 === 0) {
      this.sendLeaderboard();
    }

    if (tickIndex % 10 === 0) {
      this.sendWorldState();
      this.sendSpectatorWorldState();
    }

    for (const c of this.users.array) {
      const messages = this.queuedMessagesToSend[c.connectionId];
      if (messages && messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
        messages.length = 0;
      }
    }

    for (const c of this.spectators.array) {
      const messages = this.queuedMessagesToSend[c.connectionId];
      if (messages && messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
        messages.length = 0;
      }
    }

    this.game.postTick(tickIndex, duration);

    const now = +new Date();
    for (let i = this.serverSocket.connections.array.length - 1; i >= 0; i--) {
      const connection = this.serverSocket.connections.array[i];
      if (this.users.lookup(connection.connectionId)) {
        if (connection.lastAction + GameConstants.lastActionTimeout < now) {
          this.serverSocket.disconnect(connection.connectionId);
          continue;
        }
      } else if (!connection.spectatorJoin && connection.lastAction + GameConstants.noMessageDuration < now) {
        this.serverSocket.disconnect(connection.connectionId);
        continue;
      } else if (this.spectators.lookup(connection.connectionId)) {
        if (connection.spectatorJoin! + GameConstants.totalSpectatorDuration < now) {
          this.serverSocket.disconnect(connection.connectionId);
          continue;
        }
      }

      if (connection.lastPing + GameConstants.lastPingTimeout < now) {
        this.serverSocket.disconnect(connection.connectionId);
      }
    }
  }

  spectatorJoin(connectionId: number) {
    const connection = this.serverSocket.connections.lookup(connectionId);
    if (connection) {
      connection.spectatorJoin = +new Date();
    } else {
      // connection is already dead
      return;
    }
    if (this.spectators.length > GameConstants.capOnServerSpectators) {
      this.serverSocket.sendMessage(connectionId, [{type: 'error', reason: 'spectatorCapacity'}]);
      this.serverSocket.disconnect(connectionId);
      return;
    }
    this.spectators.push({connectionId});

    this.sendMessageToClient(connectionId, {
      type: 'spectating',
      serverVersion: GameConstants.serverVersion,
    });
  }

  userJoin(connectionId: number) {
    const connection = this.serverSocket.connections.lookup(connectionId);
    if (connection) {
      connection.lastAction = +new Date();
    } else {
      // connection is already dead
      return;
    }
    if ('spectator' in connection.jwt) {
      this.serverSocket.disconnect(connectionId);
      return;
    }

    if (this.users.length > GameConstants.capOnServerUsers) {
      this.serverSocket.sendMessage(connectionId, [{type: 'error', reason: 'userCapacity'}]);
      this.serverSocket.disconnect(connectionId);
      return undefined;
    }

    const spectator = this.spectators.lookup(connectionId);
    if (spectator) {
      this.spectators.remove(spectator);
    }
    const user = this.users.lookup(connectionId);
    if (user) {
      this.userLeave(connectionId);
      this.queuedMessagesToSend[connectionId] = [];
    }
    return connection;
  }

  userLeave(connectionId: number) {
    const spectator = this.spectators.lookup(connectionId);
    if (spectator) {
      this.spectators.remove(spectator);
    }
    const user = this.users.lookup(connectionId);
    if (!user) {
      delete this.queuedMessagesToSend[connectionId];
      return;
    }
    if (user.entity) user.entity.die();
    this.users.remove(user);
    delete this.queuedMessagesToSend[connectionId];
  }

  private sendLeaderboard() {
    if (this.users.array.length === 0 && this.spectators.array.length === 0) return;

    const scores = this.gameLeaderboard?.updateScores();
    if (!scores) {
      return;
    }
    for (const score of scores) {
      score.username = this.users.array.find((a) => a.entity?.entityId === score.userId)?.name ?? '';
    }

    const topTen = [...scores].slice(0, 10);
    for (const user of this.users.array) {
      if (topTen.find((a) => a.userId === user.entity?.entityId)) {
        this.sendMessageToClient(user.connectionId, {
          type: 'leaderboard',
          scores: topTen,
        });
      } else {
        const myScore = scores.find((a) => a.userId === user.entity?.entityId)!;
        if (myScore) {
          this.sendMessageToClient(user.connectionId, {
            type: 'leaderboard',
            scores: [...topTen, myScore],
          });
        } else {
          this.sendMessageToClient(user.connectionId, {
            type: 'leaderboard',
            scores: topTen,
          });
        }
      }
    }
  }

  private sendSpectatorWorldState() {
    const spectator = this.game.spectatorEntity;
    if (!spectator) {
      return;
    }
    const totalPlayers = this.game.entities.filter((a) => a.type === 'player').length;

    const myEntities = this.game.entities.map((entity) => ({
      entity,
      serializedEntity: entity.serialize() as EntityModels,
    }));

    if (!GameDebug.dontFilterEntities) {
      const view = {
        x: spectator.position.x - GameConstants.screenRange / 2,
        y: 0,
        width: GameConstants.screenRange / 2,
        height: GameConstants.screenSize.height,
      };

      for (let i = myEntities.length - 1; i >= 0; i--) {
        const myEntity = myEntities[i];
        if (!myEntity.entity.inView(view.x, view.y, view.width, view.height, -1)) {
          myEntities.splice(i, 1);
        }
      }
    }

    for (const c of this.spectators.array) {
      this.serverSocket.sendMessage(c.connectionId, [
        {
          type: 'worldState',
          stepCount: this.game.stepCount,
          totalPlayers,
          entities: myEntities.map((a) => a.serializedEntity),
        },
      ]);
    }
  }

  private sendWorldState() {
    if (this.users.array.length === 0) return;
    const totalPlayers = this.game.entities.filter((a) => a.type === 'player').length;

    const bush = new RBushXOnly<{entity: Entity; serializedEntity: EntityModels}>();

    for (const entity of this.game.entities.array) {
      if (entity instanceof PhysicsEntity) {
        bush.insert({
          minX: entity.position.x,
          maxX: entity.position.x,
          item: {
            entity,
            serializedEntity: entity.serialize() as EntityModels,
          },
          children: undefined!,
          height: undefined!,
        });
      }
    }

    for (const user of this.users.array) {
      const myEntities: typeof bush.data.item[] = [];
      if (user.entity) {
        const view = {
          x: user.entity.position.x - GameConstants.screenRange / 2,
          y: 0,
          width: GameConstants.screenRange / 2,
          height: GameConstants.screenSize.height,
        };
        const items = bush.search({
          minX: user.entity.position.x - GameConstants.screenRange / 2,
          maxX: user.entity.position.x + GameConstants.screenRange / 2,
        });

        myEntities.push({
          entity: user.entity,
          serializedEntity: user.entity.serializeLive(),
        });

        if (!GameDebug.dontFilterEntities) {
          for (const entity of items) {
            if (entity.item.entity !== user.entity) {
              // if (!entity.item.entity.inView(view.x, view.y, view.width, view.height, user.entity.entityId)) { todo inview
              myEntities.push(entity.item);
              // }
            }
          }
        }
      } else {
        const items = bush.search({
          minX: user.deadXY!.x - GameConstants.screenRange / 2,
          maxX: user.deadXY!.x + GameConstants.screenRange / 2,
        });

        if (!GameDebug.dontFilterEntities) {
          for (const entity of items) {
            if (!('onlyVisibleToPlayerEntityId' in entity.item.entity)) {
              myEntities.push(entity.item);
            }
          }
        }
      }

      this.sendMessageToClient(user.connectionId, {
        totalPlayers,
        stepCount: this.game.stepCount,
        type: 'worldState',
        entities: myEntities.map((a) => a.serializedEntity),
      });
    }
  }
}
