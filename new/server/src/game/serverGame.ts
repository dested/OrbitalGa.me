import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {IServerSocket} from '../serverSocket';
import {uuid} from '../../../common/src/utils/uuid';
import {ColorUtils} from '../../../common/src/utils/colorUtils';

export class ServerGame {
  users: {connectionId: string}[] = [];

  constructor(private serverSocket: IServerSocket) {
    serverSocket.start(
      connectionId => {},
      connectionId => {
        this.clientLeave(connectionId);
      },
      (connectionId, message) => {
        this.processMessage(connectionId, message);
      }
    );
  }

  init() {
    let serverTick = 0;
    let time = +new Date();
    let tickTime = 0;
    const processTick = () => {
      try {
        const now = +new Date();
        const duration = now - time;
        if (duration > 220) {
          console.log(duration);
        }
        time = +new Date();
        // console.time('server tick');
        const newTickTime = +new Date();
        this.serverTick(++serverTick, duration, tickTime);
        tickTime = +new Date() - newTickTime;
        // console.timeEnd('server tick');
        // console.time('gc');
        // global.gc();
        // console.timeEnd('gc');
        setTimeout(() => {
          processTick();
        }, Math.max(Math.min(200, 200 - tickTime), 1));
      } catch (ex) {
        console.error(ex);
      }
    };
    setTimeout(() => {
      processTick();
    }, 1000 / 5);
  }

  clientLeave(connectionId: string) {
    const client = this.users.find(c => c.connectionId === connectionId);
    if (!client) {
      return;
    }
    this.users.splice(this.users.indexOf(client), 1);
  }

  clientJoin(connectionId: string) {
    const teamId = uuid();
    const color = ColorUtils.randomColor();

    this.users.push({connectionId});
    this.sendMessageToClient(connectionId, {type: 'joined'});
  }

  serverTick(tickIndex: number, duration: number, tickTime: number) {
    console.log(
      `tick: ${tickIndex}, Teams: ${this.users.length}, Messages:${this.queuedMessages.length}, Duration: ${tickTime}`
    );

    const time = +new Date();
    let stopped = false;
    for (let i = 0; i < this.queuedMessages.length; i++) {
      if (time + 500 < +new Date()) {
        console.log('stopped');
        stopped = true;
        this.queuedMessages.splice(0, i);
        break;
      }
      const q = this.queuedMessages[i];
      switch (q.message.type) {
        case 'join':
          this.clientJoin(q.connectionId);
          break;
        case 'join2':
          this.clientJoin(q.connectionId);
          break;
        default:
          unreachable(q.message);
      }
    }
    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }

    for (const c of this.users) {
      const messages: ServerToClientMessage[] = [];
      for (const q of this.queuedMessagesToSend) {
        if (q.connectionId === null || q.connectionId === c.connectionId) {
          messages.push(q.message);
        }
      }
      if (messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
      }
    }
    this.queuedMessagesToSend.length = 0;
  }

  queuedMessages: {connectionId: string; message: ClientToServerMessage}[] = [];
  queuedMessagesToSend: {connectionId: string | null; message: ServerToClientMessage}[] = [];

  sendMessageToClient(connectionId: string, message: ServerToClientMessage) {
    this.queuedMessagesToSend.push({connectionId, message});
  }
  sendMessageToClients(message: ServerToClientMessage) {
    this.queuedMessagesToSend.push({connectionId: null, message});
  }

  processMessage(connectionId: string, message: ClientToServerMessage) {
    this.queuedMessages.push({connectionId, message});
  }
}
