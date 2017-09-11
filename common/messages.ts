import {AttackType, PlayerDirection} from "./player";

export enum MessageType {
    GameStart,
    PlayerStart,
    Move,
    Attack,
    SyncPlayer
}

export type TickMessage = {
    tick: number;
};
export type PlayerMessage = {
    playerId: string;
};

export class MessageUtils {
    static isPlayerMessage(message: Message): message is Message & PlayerMessage {
        return (message as PlayerMessage).playerId !== undefined;
    }

    static isTickMessage(message: Message): message is Message & TickMessage {
        return (message as TickMessage).tick !== undefined;
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
    moving: PlayerDirection;
    movingStart?: number|null;
    movingStartX?: number|null;
}

export type GameStartMessage = { type: MessageType.GameStart; data: SyncMessage; } & TickMessage;
export type PlayerStartMessage = { type: MessageType.PlayerStart; playerName: string; };
export type SyncPlayerMessage = { type: MessageType.SyncPlayer; data: SyncMessage } & TickMessage;
export type MoveMessage = { type: MessageType.Move; moving: PlayerDirection; x: number; duration: number; } & PlayerMessage;
export type AttackMessage = { type: MessageType.Attack; attackType: AttackType; duration: number;} & PlayerMessage;

export type Message =
    GameStartMessage |
    PlayerStartMessage |
    SyncPlayerMessage |
    AttackMessage |
    MoveMessage;