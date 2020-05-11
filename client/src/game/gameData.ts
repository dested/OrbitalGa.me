import {GameView} from './gameView';
import {GameConstants} from '@common/game/gameConstants';
import {ClientGameUI} from './clientGameUI';
import {ClientSocket} from '../socket/clientSocket';
import {LocalClientSocket} from '../serverMocking/localClientSocket';
import {LocalServerSocket} from '../serverMocking/localServerSocket';
import {STOCError} from '@common/models/serverToClientMessages';
import {ServerStatSync} from '../../../server/src/game/IServerSync';
import {uiStore} from '../store/uiStore';
import {LeaderboardEntry, LeaderboardEntryUserDetails} from '@common/game/gameLeaderboard';
import {ClientEngine, ClientGameOptions} from './clientEngine';
import {OrbitalServerEngine} from '../../../server/src/game/orbitalServerEngine';
import {OrbitalGame} from '@common/game/game';
import {BotClientEngine} from './botClientEngine';

export class GameData {
  static client?: ClientGameUI;

  static view: GameView;
  private static serverPath?: string;

  static getClientSocket() {
    if (GameConstants.isSinglePlayer) {
      return new LocalClientSocket();
    } else {
      return new ClientSocket(uiStore.jwt || uiStore.spectateJwt);
    }
  }

  static joinGame(serverPath: string, options: ClientGameOptions) {
    this.client?.clientEngine.disconnect();
    this.serverPath = serverPath;
    this.client = new ClientGameUI(this.serverPath, options, this.getClientSocket());
  }

  static setOptions(options: ClientGameOptions) {
    this.client?.clientEngine.setOptions(options);
  }

  static spectateGame(serverPath: string) {
    this.serverPath = serverPath;
    this.client = new ClientGameUI(
      this.serverPath,
      {
        onError: (client: ClientEngine, error: STOCError) => {},
        onDied: () => {},
        onUIUpdate: () => {},
        onReady: () => {},
        onOpen: () => {
          this.client!.clientEngine.spectateGame();
        },
        onDisconnect: () => {},
      },
      this.getClientSocket()
    );
  }

  static start() {
    this.view = new GameView(GameConstants.screenSize.width, GameConstants.screenSize.height);

    window.addEventListener(
      'resize',
      () => {
        this.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.height);
      },
      true
    );

    if (GameConstants.isSinglePlayer) {
      const serverSocket = new LocalServerSocket();
      const serverGame = new OrbitalServerEngine(
        serverSocket,
        {
          async setStat(serverStat: ServerStatSync): Promise<void> {},
          async startServer(): Promise<void> {},
          async syncLeaderboard(): Promise<void> {},
          setLeaderboardEntry(activePlayerScore: LeaderboardEntry & LeaderboardEntryUserDetails): void {},
        },
        new OrbitalGame(true)
      );
      serverGame.init();
      for (let i = 0; i < GameConstants.numberOfSinglePlayerBots; i++) {
        new BotClientEngine(
          '1',
          {
            onError: () => {},
            onDied: (client) => {
              client.joinGame();
            },
            onUIUpdate: () => {},
            onReady: () => {},
            onOpen: (client) => {
              client.joinGame();
            },
            onDisconnect: () => {},
          },
          this.getClientSocket(),
          new OrbitalGame(false)
        );
      }
    }
  }
}
