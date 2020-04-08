import {WebSocketServer} from './webSocketServer';

export class WebSocketClient {
  binaryType: string = '';
  onclose?: () => void;
  onerror?: (e: any) => void;
  onmessage?: (message: {data: any}) => void;

  onopen?: () => void;
  onSend?: (message: any) => void;

  constructor(url: string) {
    WebSocketServer.singleton.connectionCallback?.(this);
  }

  close() {}

  send(message: any) {
    this.onSend?.(message);
  }
}
