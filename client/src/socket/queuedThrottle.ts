import {Utils} from '@common/utils/utils';

export class QueuedThrottle {
  execute?: (message: any) => void;
  maxTime = 150;
  messages: {lag: number; message: any; timeSent: number}[] = [];
  minTime = 50;

  sendMessage(message: any) {
    const timeSent = this.messages[this.messages.length - 1]
      ? this.messages[this.messages.length - 1].timeSent + this.messages[this.messages.length - 1].lag
      : +new Date();
    this.messages.push({
      message,
      timeSent,
      lag: Utils.randomInRange(this.minTime, this.maxTime),
    });

    const timeout =
      this.messages[this.messages.length - 1].timeSent + this.messages[this.messages.length - 1].lag - +new Date();
    setTimeout(() => {
      this.execute?.(this.messages[0].message);
      this.messages.splice(0, 1);
    }, timeout);
  }
}
