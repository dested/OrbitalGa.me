import {action, observable} from 'mobx';
import {persist} from 'mobx-persist';
import {GameConstants} from '@common/game/gameConstants';
import {Jwt, makeJwt} from '../../utils/jwt';

type Screens = 'loading' | 'login' | 'game' | 'leaderboard';

export class UIStore {
  @persist
  @observable
  jwt?: Jwt;

  @persist
  @observable
  playerName: string = '';

  @observable
  screen: Screens = 'loading';

  @observable
  serverIsDown?: boolean;

  @observable
  serverPath?: string;

  @observable
  spectateJwt?: Jwt;

  @action setJwt(jwt: Jwt) {
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
    if (serverIsDown) {
      GameConstants.isSinglePlayer = true;
    }
  }

  @action setServerPath(serverPath: string) {
    this.serverPath = serverPath;
  }

  setSpectateJwt(spectateJwt: string) {
    this.spectateJwt = makeJwt(spectateJwt);
  }
}

export const uiStore = new UIStore();
export type UIStoreProps = {uiStore: UIStore};
