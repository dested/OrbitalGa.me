import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {uuid} from '../../../common/src/utils/uuid';
import {ClientSocket, IClientSocket} from '../clientSocket';

export class ClientGame {
  connectionId: string;
  protected isDead: boolean = false;

  constructor(
    private options: {onDied: (me: ClientGame) => void; onDisconnect: (me: ClientGame) => void},
    private socket: IClientSocket
  ) {
    this.connectionId = uuid();
    this.socket.connect({
      onOpen: () => {
        this.sendMessageToServer({type: 'join'});
      },
      onDisconnect: () => {
        options.onDisconnect(this);
      },

      onMessage: messages => {
        this.processMessages(messages);
      },
    });

    this.startTick();
  }

  private startTick() {
    let time = +new Date();
    let paused = 0;
    const int = setInterval(() => {
      if (this.isDead) {
        clearInterval(int);
        return;
      }
      const now = +new Date();
      const duration = now - time;
      if (duration > 900 || duration < 4) {
        paused++;
      } else {
        if (paused > 3) {
          paused = 0;
          /*
           console.log('resync');
          this.sendMessageToServer({
            type: 'resync',
          });
*/
        }
      }
      this.tick(duration);
      time = +new Date();
    }, 1000 / 60);
  }

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }

  processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          // this.myTeamId = message.yourTeamId;
          break;

        case 'joined2':
          // this.myTeamId = message.yourTeamId;
          break;
        default:
          unreachable(message);
          break;
      }
    }
  }

  tick(duration: number) {
    if (!this.connectionId) {
      return;
    }
  }

  disconnect() {
    this.socket.disconnect();
  }
}
