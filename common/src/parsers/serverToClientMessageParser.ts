import {ServerToClientMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {EntityBufferType, EntityBufferValueLookup} from '../models/entityTypeModels';
import {Utils} from '../utils/utils';
import {LeaderboardEntry, LeaderboardEntryRanked, LeaderboardEntryRankedKeys} from '../game/gameLeaderboard';

export class ServerToClientMessageParser {
  static fromServerToClientMessages(messages: ServerToClientMessage[]) {
    const buff = new ArrayBufferBuilder(1000);
    buff.addUint16(messages.length);
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          buff.addUint8(1);
          EntityBufferType.livePlayer.addBuffer(buff, message);
          buff.addUint16(message.serverVersion);
          break;
        case 'spectating':
          buff.addUint8(2);
          buff.addUint16(message.serverVersion);
          break;
        case 'error':
          buff.addUint8(3);
          buff.addSwitch(message.reason, {nameInUse: 1});
          break;
        case 'leaderboard':
          buff.addUint8(4);
          buff.addLoop(message.scores, (score) => {
            for (const key of LeaderboardEntryRankedKeys) {
              buff.addUint16(score[key]);
            }
            buff.addString(score.username);
          });
          break;
        case 'worldState':
          buff.addUint8(5);
          buff.addLoop(message.entities, (entity) => {
            const type = EntityBufferType[entity.entityType];
            buff.addUint8(type.value);
            type.addBuffer(buff, entity as any);
          });
          break;
        default:
          throw unreachable(message);
      }
    }
    return buff.buildBuffer();
  }

  static toServerToClientMessages(buffer: ArrayBuffer): ServerToClientMessage[] {
    const reader = new ArrayBufferReader(buffer);
    const result: ServerToClientMessage[] = reader.loop(() => {
      return reader.switch<1 | 2 | 3 | 4 | 5, ServerToClientMessage>({
        1: () => ({
          type: 'joined',
          ...EntityBufferType.livePlayer.readBuffer(reader),
          serverVersion: reader.readUint16(),
        }),
        2: () => ({
          type: 'spectating',
          serverVersion: reader.readUint16(),
        }),
        3: () => ({
          type: 'error',
          reason: reader.switch({1: () => 'nameInUse' as const}),
        }),
        4: () => ({
          type: 'leaderboard',
          scores: reader.loop(() => {
            const score: {[key in keyof LeaderboardEntryRanked]?: LeaderboardEntryRanked[key]} = {};
            for (const key of LeaderboardEntryRankedKeys) {
              score[key] = reader.readUint16();
            }
            score.username = reader.readString();
            return score as Required<typeof score>;
          }),
        }),
        5: () => ({
          type: 'worldState',
          entities: reader.loop(() => {
            const option = reader.readUint8();
            const entityBufferTypeElement = EntityBufferType[EntityBufferValueLookup[option]];
            if (!entityBufferTypeElement) {
              throw new Error(`Buffer option not found: ${option}`);
            }
            return entityBufferTypeElement.readBuffer(reader);
          }),
        }),
      });
    });
    reader.done();
    return result;
  }
}
