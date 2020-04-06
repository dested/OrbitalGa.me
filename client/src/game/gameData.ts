import {GameView} from './gameView';
import {GameConstants} from '@common/game/gameConstants';
import React from 'react';
import {ClientGameUI} from './clientGameUI';
import {ClientSocket} from '../clientSocket';

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
      new ClientSocket()
    );
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
        new ClientSocket()
      );
    } else {
      this.client!.sendMessageToServer({type: 'join'});
    }
  }
}
