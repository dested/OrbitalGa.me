import {MessageType, MessageUtils, PlayerMessage} from '@common/messages';
import {ClientTimeUtils} from '@common/player';
import {ClientBoard} from './clientBoard';
import {Network} from './network';

export class GameManager {
  private static _instance: GameManager;
  debugValue: (key: string, value: any) => void;

  static get instance(): GameManager {
    if (!this._instance) {
      this._instance = new GameManager();
    }
    return this._instance;
  }

  constructor() {
    this.network = new Network();
  }

  network: Network;
  board: ClientBoard | null;

  joinGame(playerName: string, statusChange: (status: 'fail' | 'connecting' | 'joining' | 'joined') => void) {
    this.network.connect(
      () => {
        this.network.sendMessage({type: MessageType.PlayerStart, playerName, time: ClientTimeUtils.getNow()});
        statusChange('joining');
      },
      message => {
        switch (message.type) {
          case MessageType.GameStart:
            ClientTimeUtils.setServerNow(message.time);
            this.board = new ClientBoard();
            this.board.loadBoard(message.data);
            statusChange('joined');
            return;
          case MessageType.SyncPlayer:
            this.board!.updateBoard(message.data);
            return;
        }

        if (MessageUtils.isPlayerMessage(message)) {
          const player = this.board!.players.find(a => a.playerId === message.playerId);
          if (player) {
            this.board!.processMessage(player, message);
          }
        }
      }
    );
  }

  die() {
    this.board = null;
    this.network.disconnect();
  }

  setDebugger(debugValue: (key: string, value: string) => any) {
    this.debugValue = debugValue;
  }
}
