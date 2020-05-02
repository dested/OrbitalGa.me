export class ClientConfig {
  static isLocal = false;
  static get graphqlEndpoint() {
    switch (this.isLocal) {
      case true:
        return 'http://localhost:3116/graphql';
      case false:
        return `https://api.orbitalga.me/graphql`;
    }
  }
  static websocketUrl(serverPath: string) {
    switch (this.isLocal) {
      case true:
        return 'ws://192.168.86.21:8081';
      case false:
        return `wss://game.orbitalga.me/${serverPath}`;
    }
  }
}
