import {WebSocketServer} from './webSocketServer';

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
