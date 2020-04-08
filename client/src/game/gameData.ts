import {GameView} from './gameView';
import {GameConstants} from '@common/game/gameConstants';
import {ClientGameUI} from './clientGameUI';
import {ClientSocket} from '../clientSocket';
import {ServerGame} from '../../../server/src/game/serverGame';
import {LocalClientSocket} from '../serverMocking/localClientSocket';
import {LocalServerSocket} from '../serverMocking/localServerSocket';
import {BotClientGame} from './botClientGame';
import {ClientGameOptions} from './clientGame';

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
            onDied: (client) => {
              client.joinGame();
            },
            onOpen: (client) => {
              client.joinGame();
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

  joinGame(serverPath: string, options: ClientGameOptions) {
    if (this.serverPath !== serverPath) {
      this.serverPath = serverPath;
      this.client = new ClientGameUI(this.serverPath, options, this.getClientSocket());
    } else {
      this.client!.setOptions(options);
      this.client!.joinGame();
    }
  }

  spectateGame(serverPath: string) {
    this.serverPath = serverPath;
    this.client = new ClientGameUI(
      this.serverPath,
      {
        onDied: () => {},
        onOpen: () => {
          this.client!.spectateGame();
        },
        onDisconnect: () => {},
      },
      this.getClientSocket()
    );
  }
}
