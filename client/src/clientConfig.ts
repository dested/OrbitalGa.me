import {GameDebug} from '@common/game/gameConstants';

export class ClientConfig {
  static get graphqlEndpoint() {
    switch (GameDebug.isLocal) {
      case true:
        return 'http://localhost:3116/graphql';
      case false:
        return `https://api.orbitalga.me/graphql`;
    }
  }
  static websocketUrl(serverPath: string) {
    switch (GameDebug.isLocal) {
      case true:
        return 'ws://localhost:8081';
      case false:
        return `wss://game.orbitalga.me/${serverPath}`;
    }
  }
}
