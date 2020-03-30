import {GameConstants} from '../../common/src/game/gameConstants';
import {ClientToServerMessage, ServerToClientMessage} from '../../common/src/models/messages';
import {ClientToServerMessageParser} from '../../common/src/parsers/clientToServerMessageParser';
import {ServerToClientMessageParser} from '../../common/src/parsers/serverToClientMessageParser';
import {uuid} from '../../common/src/utils/uuid';
import {IServerSocket} from '../../server/src/serverSocket';
import {IClientSocket} from './clientSocket';

export class WebSocketServer {
  static singleton: WebSocketServer;

  connectionCallback?: (wsClient: WebSocketClient) => void;
  constructor(options: any) {
    WebSocketServer.singleton = this;
  }
  on(event: 'connection', cb: (socket: WebSocketServerSocket) => void): this {
    this.connectionCallback = (wsClient: WebSocketClient) => {
      cb(new WebSocketServerSocket(wsClient));

      setTimeout(() => wsClient.onopen?.(), 10);
    };
    return this;
  }
}

export class WebSocketServerSocket {
  private onMessageCallback?: (message: {}) => void;
  constructor(private wsClient: WebSocketClient) {
    wsClient.onSend = (message: any) => {
      this.onMessageCallback?.(message);
    };
  }

  binaryType: string = '';
  onmessage(callback: (message: {}) => void) {
    this.onMessageCallback = callback;
  }
  onclose(callback: () => void) {}
  send(message: string | ArrayBuffer) {
    this.wsClient.onmessage?.({data: message});
  }
}

export class WebSocketClient {
  binaryType: string = '';
  onSend?: (message: any) => void;

  constructor(url: string) {
    WebSocketServer.singleton.connectionCallback?.(this);
  }
  onopen?: () => void;
  onerror?: (e: any) => void;
  onclose?: () => void;
  onmessage?: (message: {data: any}) => void;

  close() {}

  send(message: any) {
    this.onSend?.(message);
  }
}

export class LocalServerSocket implements IServerSocket {
  wss?: WebSocketServer;
  connections: {connectionId: string; socket: WebSocketServerSocket}[] = [];

  start(
    onJoin: (connectionId: string) => void,
    onLeave: (connectionId: string) => void,
    onMessage: (connectionId: string, message: ClientToServerMessage) => void
  ) {
    const port = parseInt(process.env.PORT || '8081');
    this.wss = new WebSocketServer({port, perMessageDeflate: false});

    this.wss.on('connection', ws => {
      ws.binaryType = 'arraybuffer';
      const me = {socket: ws, connectionId: uuid()};
      // console.log('new connection', me.connectionId);
      this.connections.push(me);

      ws.onmessage(message => {
        if (GameConstants.binaryTransport) {
          this.totalBytesReceived += (message as ArrayBuffer).byteLength;
          onMessage(me.connectionId, ClientToServerMessageParser.toClientToServerMessage(message as ArrayBuffer));
        } else {
          onMessage(me.connectionId, JSON.parse(message as string));
        }
      });

      ws.onclose = () => {
        const ind = this.connections.findIndex(a => a.connectionId === me.connectionId);
        if (ind === -1) {
          return;
        }
        this.connections.splice(ind, 1);
        onLeave(me.connectionId);
      };
      onJoin(me.connectionId);
    });
  }

  sendMessage(connectionId: string, messages: ServerToClientMessage[]) {
    const client = this.connections.find(a => a.connectionId === connectionId);
    if (!client) {
      return;
    }
    if (GameConstants.binaryTransport) {
      const body = ServerToClientMessageParser.fromServerToClientMessages(messages);
      this.totalBytesSent += body.byteLength;
      client.socket.send(body);
    } else {
      const body = JSON.stringify(messages);
      this.totalBytesSent += body.length * 2 + 1;
      client.socket.send(body);
    }
  }
  totalBytesSent = 0;
  totalBytesReceived = 0;
}

export class LocalClientSocket implements IClientSocket {
  private socket?: WebSocketClient;
  connect(options: {
    onOpen: () => void;
    onMessage: (messages: ServerToClientMessage[]) => void;
    onDisconnect: () => void;
  }) {
    // this.socket = new WebSocket('wss://game.quickga.me');
    this.socket = new WebSocketClient('ws://localhost:8081');
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = () => {
      options.onOpen();
    };
    this.socket.onerror = e => {
      console.log(e);
      this.socket?.close();
      options.onDisconnect();
    };
    this.socket.onmessage = e => {
      if (GameConstants.binaryTransport) {
        options.onMessage(ServerToClientMessageParser.toServerToClientMessages(e.data));
      } else {
        options.onMessage(JSON.parse(e.data));
      }
    };
    this.socket.onclose = () => {
      options.onDisconnect();
    };
  }

  sendMessage(message: ClientToServerMessage) {
    if (!this.socket) {
      throw new Error('Not connected');
    }
    try {
      if (GameConstants.binaryTransport) {
        this.socket.send(ClientToServerMessageParser.fromClientToServerMessage(message));
      } else {
        this.socket.send(JSON.stringify(message));
      }
    } catch (ex) {
      console.error('disconnected??');
    }
  }

  disconnect() {
    this.socket?.close();
  }
}
