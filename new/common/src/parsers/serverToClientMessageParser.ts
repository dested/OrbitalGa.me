import {ServerToClientMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {Utils} from '../utils/utils';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';

export class ServerToClientMessageParser {
  static fromServerToClientMessages(messages: ServerToClientMessage[]) {
    const buff = new ArrayBufferBuilder();
    buff.addUint16(messages.length);
    for (const message of messages) {
      /*
      switch (message.type) {
        case 'joined':
          buff.addUint8(1);
          break;
        case 'joined2':
          buff.addUint8(2);
          break;
        default:
          throw unreachable(message);
      }
*/
    }
    return buff.buildBuffer();
  }

  static toServerToClientMessages(buffer: ArrayBuffer): ServerToClientMessage[] {
    const reader = new ArrayBufferReader(buffer);
    return reader.loop(() => {
      const type = reader.readUint8();
      return undefined as any;
      /*
      switch (type) {
        case 1:
          return {
            type: 'joined',
          };

        case 2:
          return {
            type: 'joined2',
          };
        default:
          throw new Error('Missing buffer enum');
      }
*/
    });
  }
}
