import {GameView} from './gameView';
import {GameConstants} from '@common/game/gameConstants';
import {ClientGameUI} from './clientGameUI';
import {ClientSocket} from '../clientSocket';
import {ServerGame} from '../../../server/src/game/serverGame';
import {LocalClientSocket} from '../serverMocking/localClientSocket';
import {LocalServerSocket} from '../serverMocking/localServerSocket';

export class GameData {
  static instance = new GameData();

  view: GameView;
  private serverPath?: string;
  client?: ClientGameUI;

  private constructor() {
    this.view = new GameView(GameConstants.screenSize.width, GameConstants.screenSize.height);

    window.addEventListener(
      'resize',
      () => {
        this.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.height);
      },
      true
    );

    if (GameConstants.singlePlayer) {
      const serverSocket = new LocalServerSocket();
      const serverGame = new ServerGame(serverSocket);
      serverGame.init();
    }
  }

  spectateGame(serverPath: string) {
    this.serverPath = serverPath;
    this.client = new ClientGameUI(
      this.serverPath,
      {
        onDied: () => {},
        onOpen: () => {
          this.client!.sendMessageToServer({type: 'spectate'});
        },
        onDisconnect: () => {},
      },
      this.getClientSocket()
    );
  }

  getClientSocket() {
    if (GameConstants.singlePlayer) {
      return new LocalClientSocket();
    } else {
      return new ClientSocket();
    }
  }

  joinGame(serverPath: string) {
    if (this.serverPath !== serverPath) {
      this.serverPath = serverPath;
      this.client = new ClientGameUI(
        this.serverPath,
        {
          onDied: () => {},
          onOpen: () => {
            this.client!.sendMessageToServer({type: 'join'});
          },
          onDisconnect: () => {},
        },
        this.getClientSocket()
      );
    } else {
      this.client!.sendMessageToServer({type: 'join'});
    }
  }
}
