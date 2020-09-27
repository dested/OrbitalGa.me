import {GameView} from './gameView';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {ClientEngineUI} from './clientEngineUI';
import {ClientSocket} from '../socket/clientSocket';
import {LocalClientSocket} from '../serverMocking/localClientSocket';
import {LocalServerSocket} from '../serverMocking/localServerSocket';
import {STOCError} from '@common/models/serverToClientMessages';
import {ServerStatSync} from '../../../server/src/game/IServerSync';
import {uiStore} from '../store/uiStore';
import {LeaderboardEntry, LeaderboardEntryUserDetails} from '@common/game/gameLeaderboard';
import {ClientEngine, ClientGameOptions, OrbitalClientEngine} from './clientEngine';
import {OrbitalServerEngine} from '../../../server/src/game/orbitalServerEngine';
import {OrbitalGame} from '@common/game/game';
import {BotClientEngine} from './botClientEngine';
import {ActorEntityTypes} from './entities/entityTypeModels';

class ServerGameUI {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  constructor(private serverGame: OrbitalServerEngine, private orbitalClientEngine: OrbitalClientEngine) {
    this.canvas = document.getElementById('serverGame') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    window.addEventListener(
      'resize',
      () => {
        this.canvas.width = GameConstants.screenSize.width;
        this.canvas.height = GameConstants.screenSize.height;
        GameData.view.setBounds(GameConstants.screenSize.width, GameConstants.screenSize.height);
        this.draw();
      },
      true
    );
    const requestNextFrame = () => {
      requestAnimationFrame(() => {
        this.draw();
        requestNextFrame();
      });
    };
    requestNextFrame();
  }

  draw() {
    this.canvas = document.getElementById('serverGame') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const gameData = GameData;
    context.globalCompositeOperation = 'color';

    context.save();
    const box = gameData.view.viewBox;
    context.scale(gameData.view.scale, gameData.view.scale);
    context.translate(-box.x, -box.y);

    context.font = '25px bold';
    const entities = this.serverGame.game.entities.array;

    for (const entity of this.serverGame.game.entities.array) {
      if (!entity.actor) {
        entity.actor = new ActorEntityTypes[entity.type](this.orbitalClientEngine, entity as any);
      }
    }

    const sortedEntities = entities.sort((a, b) => a.actor!.zIndex - b.actor!.zIndex);

    const {outerViewBox} = gameData.view;
    for (const entity of sortedEntities) {
      if (
        !entity.inView(
          outerViewBox.x,
          outerViewBox.y,
          outerViewBox.width,
          outerViewBox.height,
          this.serverGame.game.clientPlayerId!
        )
      ) {
        continue;
      }
      entity.actor!.draw(context);
    }

    context.restore();
    for (const entity of sortedEntities) {
      if (
        !entity.inView(
          outerViewBox.x,
          outerViewBox.y,
          outerViewBox.width,
          outerViewBox.height,
          this.serverGame.game.clientPlayerId!
        )
      ) {
        continue;
      }
      entity.actor!.staticDraw(context);
    }
  }
}

export class GameData {
  static client?: ClientEngineUI;

  static view: GameView;
  private static serverGame?: OrbitalServerEngine;
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
    this.client = new ClientEngineUI(this.serverPath, options, this.getClientSocket());
    if (GameDebug.renderServer) {
      new ServerGameUI(this.serverGame!, this.client.clientEngine);
    }
  }

  static setOptions(options: ClientGameOptions) {
    this.client?.clientEngine.setOptions(options);
  }

  static spectateGame(serverPath: string) {
    this.serverPath = serverPath;
    this.client = new ClientEngineUI(
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
      this.serverGame = new OrbitalServerEngine(
        serverSocket,
        {
          async setStat(serverStat: ServerStatSync): Promise<void> {},
          async startServer(): Promise<void> {},
          async syncLeaderboard(): Promise<void> {},
          setLeaderboardEntry(activePlayerScore: LeaderboardEntry & LeaderboardEntryUserDetails): void {},
        },
        new OrbitalGame(false)
      );
      this.serverGame.init();

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
