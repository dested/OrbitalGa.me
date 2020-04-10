import {WebSocketServer} from './webSocketServer';

export class WebSocketClient {
  binaryType: string = '';

  connected: boolean = false;
  onclose?: () => void;
  onerror?: (e: any) => void;
  onmessage?: (message: {data: any}) => void;

  onopen?: () => void;
  onSend?: (message: any) => void;

  constructor(url: string) {
    WebSocketServer.singleton.connectionCallback?.(this);
    this.connected = true;
  }

  close() {
    this.onclose?.();
    this.connected = false;
  }

  send(message: any) {
    this.onSend?.(message);
  }
}
