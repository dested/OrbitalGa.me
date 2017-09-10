export enum MessageType {
    GameStart,
    PlayerStart,
    MoveLeftStart,
    MoveLeftStop,
    MoveRightStart,
    MoveRightStop,
    SyncPlayer
}

export type TickMessage = {
    tick: number;
};

export interface SyncMessage {
    players: { x: number, me: boolean; playerName: string; holdingLeft: boolean, holdingRight: boolean }[];
}

export type Message =
    (
    { type: MessageType.GameStart; data: SyncMessage; } & TickMessage
    ) | (
    { type: MessageType.PlayerStart; playerName: string; }
    ) | (
    { type: MessageType.SyncPlayer; data: SyncMessage } & TickMessage
    ) | (
    { type: MessageType.MoveLeftStart; } & TickMessage
    ) | (
    { type: MessageType.MoveLeftStop; } & TickMessage
    ) | (
    { type: MessageType.MoveRightStart; } & TickMessage
    ) | (
    { type: MessageType.MoveRightStop; } & TickMessage
    ) ;