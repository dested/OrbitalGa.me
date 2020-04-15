import {GameView} from './gameView';
import {GameConstants} from '@common/game/gameConstants';
import {ClientGameUI} from './clientGameUI';
import {ClientSocket} from '../clientSocket';
import {ServerGame} from '../../../server/src/game/serverGame';
import {LocalClientSocket} from '../serverMocking/localClientSocket';
import {LocalServerSocket} from '../serverMocking/localServerSocket';
import {BotClientGame} from './botClientGame';
import {ClientGame, ClientGameOptions} from './clientGame';
import {ErrorMessage} from '@common/models/serverToClientMessages';

export class GameData {
  static instance = new GameData();
  client?: ClientGameUI;

  view: GameView;
  private serverPath?: string;

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
      for (let i = 0; i < GameConstants.numberOfSinglePlayerBots; i++) {
        new BotClientGame(
          '1',
          {
            onError: (client: ClientGame, error: ErrorMessage) => {},
            onDied: (client) => {
              client.joinGame(Math.random().toFixed(8));
            },
            onUIUpdate: () => {},
            onReady: () => {},
            onOpen: (client) => {
              client.joinGame(Math.random().toFixed(8));
            },
            onDisconnect: () => {},
          },
          this.getClientSocket()
        );
      }
    }
  }

  getClientSocket() {
    if (GameConstants.singlePlayer) {
      return new LocalClientSocket();
    } else {
      return new ClientSocket();
    }
  }

  joinGame(serverPath: string, name: string, options: ClientGameOptions) {
    if (!this.client || this.serverPath !== serverPath) {
      this.client?.disconnect();
      this.serverPath = serverPath;
      this.client = new ClientGameUI(this.serverPath, options, this.getClientSocket());
    } else {
      if (!this.client.socket.isConnected()) {
        this.client.setOptions(options);
        this.client.connect();
      } else {
        this.client.setOptions(options);
        this.client.joinGame(name);
      }
    }
  }

  setOptions(options: ClientGameOptions) {
    this.client?.setOptions(options);
  }

  spectateGame(serverPath: string) {
    this.serverPath = serverPath;
    this.client = new ClientGameUI(
      this.serverPath,
      {
        onError: (client: ClientGame, error: ErrorMessage) => {},
        onDied: () => {},
        onUIUpdate: () => {},
        onReady: () => {},
        onOpen: () => {
          this.client!.spectateGame();
        },
        onDisconnect: () => {},
      },
      this.getClientSocket()
    );
  }
}
