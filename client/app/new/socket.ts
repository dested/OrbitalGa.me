import {Utils} from "./utils";

export enum ActionType {
    Left = "left",
    Right = "right",
    Up = "up",
    Down = "down",
}

export enum ActionType {
    Shoot = "shoot",
    Bomb = "bomb"
}

export enum ActionSubType {
    Other = "other",
    Up = "up",
    Down = "down"
}

export interface Action {
    actionType: ActionType;
    actionSubType: ActionSubType;
    actionTick: number,
    entityId: string,
    x: number,
    y: number,
}


export interface WorldState {
    entities: SerializedEntity[];
    currentTick: number;
    resync: boolean;
}

export type SerializedEntity = ({
    id: string;
    x: number;
    y: number;
}
    ) & (
    {
        type: 'player';
        color: string;
        lastDownAction: { [action: string]: Action };
    } |
    {
        type: 'shot';
        ownerId: string;
        tickCreated: number;
        initialY: number;
    }
    )

export type ServerMessage = {
    messageType: 'start';
    state: WorldState;
    yourEntityId: string
    serverTick: number;
} | {
    messageType: 'action';
    action: Action
} | {
    messageType: 'worldState';
    state: WorldState
}


export interface SocketClient {
    lastLatency: number;
    id: string;
    onMessage: (message: ServerMessage) => void;
    sendToServer: (message: ServerMessage) => void;
}

export class Socket {

    static ClientLatency = 10;
    static ServerLatency = 10;

    public static sockets: SocketClient[] = [];
    private static onServerMessage: (clientId: string, message: ServerMessage) => void;

    static onClientJoin: (client: SocketClient) => void;

    static clientJoin(onMessage: (message: ServerMessage) => void) {
        let client = {
            id: Utils.generateId(),
            lastLatency: 0,
            onMessage: onMessage,
            sendToServer: (message: ServerMessage) => {
                this.sendToServer(client.id, message);
            }
        };
        this.sockets.push(client);
        this.onClientJoin(client);
        return client;
    }

    static createServer(onMessage: (clientId: string, message: ServerMessage) => void, onClientJoin: (client: SocketClient) => void) {
        this.onServerMessage = onMessage;
        this.onClientJoin = onClientJoin;
    }

    private static lastLatency: number;

    static sendToServer(clientId: string, message: ServerMessage) {
        let msg = JSON.parse(JSON.stringify(message));

        if (this.lastLatency > +new Date()) {
            this.lastLatency = this.lastLatency + /*Math.random() * */this.ServerLatency;
        } else {
            this.lastLatency = +new Date() + /*Math.random() * */this.ServerLatency;
        }

        setTimeout(() => {
            // console.log('send to server', JSON.stringify(message));
            this.onServerMessage(clientId, msg);
        }, this.lastLatency - +new Date());
    }

    static sendToClient(clientId: string, message: ServerMessage) {
        const client = this.sockets.find(a => a.id === clientId);
        let msg = JSON.parse(JSON.stringify(message));
        if (client) {
            if (client.lastLatency > +new Date()) {
                client.lastLatency = client.lastLatency + /*Math.random() * */this.ClientLatency;
            } else {
                client.lastLatency = +new Date() + /*Math.random() * */this.ClientLatency;
            }
            setTimeout(() => {
                client.onMessage(msg);
            }, client.lastLatency - +new Date());
        }
    }
}
