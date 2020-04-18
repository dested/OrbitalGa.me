import {action, observable} from 'mobx';
import {persist} from 'mobx-persist';

type Screens = 'loading' | 'login' | 'game';

export class UIStore {
  @persist
  @observable
  jwt?: string;

  @persist
  @observable
  playerName: string = '';

  @observable
  screen: Screens = 'loading';

  @observable
  serverIsDown?: boolean;

  @observable
  serverPath?: string;

  @action setJwt(jwt: string) {
    this.jwt = jwt;
  }

  @action setPlayerName(playerName: string) {
    this.playerName = playerName;
  }

  @action setScreen(newScreen: Screens) {
    this.screen = newScreen;
  }

  @action setServerDown(serverIsDown: boolean) {
    this.serverIsDown = serverIsDown;
  }

  @action setServerPath(serverPath: string) {
    this.serverPath = serverPath;
  }
}

export const uiStore = new UIStore();
export type UIStoreProps = {uiStore: UIStore};
