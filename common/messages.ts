export enum MessageType {
    GameStart,
    PlayerStart,
    Move,
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
    players: { x: number, me: boolean; playerId: string; playerName: string; moving: "left" | "right" | "none" }[];
}

export type Message =
    (
    { type: MessageType.GameStart; data: SyncMessage; } & TickMessage
    ) | (
    { type: MessageType.PlayerStart; playerName: string; }
    ) | (
    { type: MessageType.SyncPlayer; data: SyncMessage } & TickMessage
    ) | (
    { type: MessageType.Move; moving: "left" | "right" | "none"; } & TickMessage & PlayerMessage
    ) ;