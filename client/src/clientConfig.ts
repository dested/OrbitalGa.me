export class ClientConfig {
  static isLocal = true;
  static websocketUrl(serverPath: string) {
    switch (this.isLocal) {
      case true:
        return 'ws://192.168.86.21:8081';
      case false:
        return `wss://game.orbitalga.me/${serverPath}`;
    }
  }
}
