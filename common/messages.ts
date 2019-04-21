import {AttackType, PlayerDirection, PlayerMoveAction} from './player';

export enum MessageType {
  GameStart,
  PlayerStart,
  Move,
  Attack,
  SyncPlayer,
}

export type TimeMessage = {
  time: number;
};
export type PlayerMessage = {
  playerId: string;
};

export class MessageUtils {
  static isPlayerMessage(message: Message): message is Message & PlayerMessage {
    return (message as PlayerMessage).playerId !== undefined;
  }
}

export interface SyncMessage {
  players: SyncPlayer[];
}

export interface SyncPlayer {
  x: number;
  me: boolean;
  playerId: string;
  shipType: string;
  playerName: string;
  actions: PlayerMoveAction[];
}

export type GameStartMessage = {type: MessageType.GameStart; data: SyncMessage} & TimeMessage;
export type PlayerStartMessage = {type: MessageType.PlayerStart; playerName: string} & TimeMessage;
export type SyncPlayerMessage = {type: MessageType.SyncPlayer; data: SyncMessage} & TimeMessage;
export type MoveMessage = {type: MessageType.Move; moving: PlayerDirection} & PlayerMessage & TimeMessage;
export type AttackMessage = {type: MessageType.Attack; attackType: AttackType} & PlayerMessage & TimeMessage;

export type Message = GameStartMessage | PlayerStartMessage | SyncPlayerMessage | AttackMessage | MoveMessage;
