import {action, observable} from 'mobx';
import {persist} from 'mobx-persist';

type Screens = 'loading' | 'login' | 'game';

export class UIStore {
  @persist
  @observable
  jwt?: string;

  @observable
  screen: Screens = 'loading';

  @action setJwt(jwt: string) {
    this.jwt = jwt;
  }

  @action setScreen(newScreen: Screens) {
    this.screen = newScreen;
  }
}

export const uiStore = new UIStore();
export type UIStoreProps = {uiStore: UIStore};
