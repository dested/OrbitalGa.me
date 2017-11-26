enum ActionType {
    Left = "left",
    Right = "right",
    Shoot = "shoot",
    Bomb = "bomb"
}

enum ActionSubType {
    None = "None",
    Up = "up",
    Down = "down"
}

interface Action {
    actionType: ActionType;
    actionSubType: ActionSubType;
    actionTick?: number,
    entityId: string,
    x: number,
    y: number,
}

interface SocketClient {
    id: string;
    onMessage: (message: ServerMessage) => void;
    sendToServer: (message: ServerMessage) => void;
}

type ServerMessage = {
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

export class Socket {

    static ClientLatency = 50;
    static ServerLatency = 50;

    public static clients: SocketClient[] = [];
    private static onServerMessage: (clientId: string, message: ServerMessage) => void;

    static onClientJoin: (client: SocketClient) => void;

    static clientJoin(onMessage: (message: ServerMessage) => void) {
        let client = {
            id: (Math.random() * 100000).toFixed(0),
            onMessage: onMessage,
            sendToServer: (message: ServerMessage) => {
                console.log('send to server', JSON.stringify(message));
                this.sendToServer(client.id, message);
            }
        };
        this.clients.push(client);
        this.onClientJoin(client);
        return client;
    }

    static createServer(onMessage: (clientId: string, message: ServerMessage) => void, onClientJoin: (client: SocketClient) => void) {
        this.onServerMessage = onMessage;
        this.onClientJoin = onClientJoin;
    }

    static sendToServer(clientId: string, message: ServerMessage) {
        setTimeout(() => {
            this.onServerMessage(clientId, message);
        }, this.ServerLatency);
    }

    static sendToClient(clientId: string, message: ServerMessage) {
        let client = this.clients.find(a => a.id === clientId);
        console.log('send to server', JSON.stringify(message));
        if (client) {
            setTimeout(() => {
                client!.onMessage(message);
            }, this.ClientLatency);
        }
    }
}

export class ClientGame {
    private serverTick: number;
    private offsetTick: number;
    socketClient: SocketClient;
    private entities: PlayerEntity[] = [];

    get liveEntity(): PlayerEntity {
        return this.entities.find(a => a.live)!;
    }

    constructor() {
    }

    unprocessedActions: Action[] = [];

    get currentServerTick() {
        return this.serverTick + (+new Date() - this.offsetTick);
    }

    sendAction(action: Action) {
        action.actionTick = this.currentServerTick;
        this.socketClient.sendToServer({messageType: 'action', action});
    }

    onConnection(serverTick: number) {
        this.serverTick = serverTick;
        this.offsetTick = +new Date();
    }

    join() {
        this.socketClient = Socket.clientJoin((message) => {
            this.onServerMessage(message);
        })
    }

    private onServerMessage(message: ServerMessage) {
        switch (message.messageType) {
            case "start":
                this.onConnection(message.serverTick);
                this.setServerState(message.state);
                this.entities.find(a => a.id === message.yourEntityId)!.live = true;
                break;
            case "worldState":
                this.setServerState(message.state);
                break;
            case "action":
                this.unprocessedActions.push(message.action);
                break;
        }
    }

    private setServerState(state: WorldState) {
        for (let i = 0; i < state.entities.length; i++) {
            let entity = state.entities[i];
            let liveEntity = this.entities.find(a => a.id === entity.id);
            if (!liveEntity) {
                liveEntity = new PlayerEntity(entity.id, this);
                this.entities.push(liveEntity)
            }
            if (liveEntity.live) {
                continue;
            }

            liveEntity.lastDownAction = entity.lastDownAction;
            liveEntity.x = entity.x;
            liveEntity.y = entity.y;
        }
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let liveEntity = this.entities[i];
            if (!state.entities.find(a => a.id === liveEntity.id)) {
                this.entities.splice(i, 1);
            }
        }
    }

    tick(timeSinceLastTick: number) {

        for (let i = 0; i < this.unprocessedActions.length; i++) {
            let action = this.unprocessedActions[i];
            let entity = this.entities.find(a => a.id === action.entityId);
            if (entity) {
                switch (action.actionSubType) {
                    case ActionSubType.Down: {
                        entity.lastDownAction[action.actionType] = action;
                        break;
                    }
                    case ActionSubType.Up: {
                        entity.processServerUp(action);
                        break;
                    }
                    case ActionSubType.None: {
                        entity.processAction(action);
                        break;
                    }
                }
            }
        }

        this.unprocessedActions.length = 0;
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
        }
    }

    draw() {
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw();
        }
    }
}


export interface WorldState {
    entities: { x: number, y: number, lastDownAction: { [action: string]: Action }, id: string }[];
    currentTick: number;
}

export class PlayerEntity {
    live: boolean;

    constructor(public id: string, private game: ClientGame) {
    }

    x: number = 0;
    y: number = 0;

    speedPerSecond: number = 10;

    pressingLeft = false;
    pressingRight = false;
    wasPressingLeft = false;
    wasPressingRight = false;


    pressLeft() {
        this.pressingLeft = true;
    }

    pressRight() {
        this.pressingRight = true;
    }

    releaseLeft() {
        this.pressingLeft = false;
    }

    releaseRight() {
        this.pressingRight = false;
    }


    tick(timeSinceLastTick: number, currentServerTick: number) {
        if (!this.live) {
            if (this.lastDownAction[ActionType.Left]) {
                let lastLeft = this.lastDownAction[ActionType.Left];
                this.x -= (currentServerTick - lastLeft.actionTick!) / 1000 * this.speedPerSecond;
                lastLeft.actionTick = currentServerTick;
                lastLeft.x = this.x;
                lastLeft.y = this.y;
            }
            if (this.lastDownAction[ActionType.Right]) {
                let lastRight = this.lastDownAction[ActionType.Right];
                this.x += (currentServerTick - lastRight.actionTick!) / 1000 * this.speedPerSecond;
                lastRight.actionTick = currentServerTick;
                lastRight.x = this.x;
                lastRight.y = this.y;
            }

        } else {
            if (this.pressingLeft) {
                if (!this.wasPressingLeft) {
                    this.game.sendAction({
                        actionType: ActionType.Left,
                        actionSubType: ActionSubType.Down,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingLeft = true;
                }
                this.x -= timeSinceLastTick / 1000 * this.speedPerSecond;
            } else if (this.pressingRight) {
                if (!this.wasPressingRight) {
                    this.game.sendAction({
                        actionType: ActionType.Right,
                        actionSubType: ActionSubType.Down,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.x += timeSinceLastTick / 1000 * this.speedPerSecond;
                    this.wasPressingRight = true;
                }
            }

            if (!this.pressingLeft) {
                if (this.wasPressingLeft) {
                    this.game.sendAction({
                        actionType: ActionType.Left,
                        actionSubType: ActionSubType.Up,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingLeft = false;
                }
            } else if (!this.pressingRight) {
                if (this.wasPressingRight) {
                    this.game.sendAction({
                        actionType: ActionType.Right,
                        actionSubType: ActionSubType.Up,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingRight = false;
                }
            }
        }
    }


    lastDownAction: { [action: string]: Action } = {};


    draw() {
        console.log('client', this.id, this.live, this.x, this.y)
    }


    processServerUp(message: Action) {
        let lastDown = this.lastDownAction[message.actionType];
        switch (message.actionType) {
            case ActionType.Left:
                this.x = lastDown.x - (message.actionTick! - lastDown.actionTick!) / 1000 * this.speedPerSecond;
                break;
            case ActionType.Right:
                this.x = lastDown.x + (message.actionTick! - lastDown.actionTick!) / 1000 * this.speedPerSecond;
                break;
        }
        delete this.lastDownAction[message.actionType];
    }

    processAction(message: Action) {
        switch (message.actionType) {
            case ActionType.Bomb:
                break;
        }
    }
}

export class Server {

    private clients: PlayerEntity[] = [];
    private startingTick: number;
    private unprocessedMessages: ServerMessage[] = [];

    get currentTick(): number {
        return +new Date() - this.startingTick;
    }

    constructor() {
        this.startingTick = +new Date();

        Socket.createServer((clientId, mesasage) => {
            this.unprocessedMessages.push(mesasage);
        }, (client) => {
            this.clients.push(new PlayerEntity(client.id, null!));
            Socket.sendToClient(client.id, {
                messageType: "start",
                yourEntityId: client.id,
                serverTick: this.currentTick,
                state: this.getWorldState()

            })
        });

        setInterval(() => {
            this.process();
        }, 5000);
    }

    lastTick = this.currentTick;

    process() {
        let curTick = this.currentTick;

        for (let i = 0; i < this.unprocessedMessages.length; i++) {
            const message = this.unprocessedMessages[i];
            if (message.messageType === "action") {
                const client = this.clients.find(a => a.id === message.action.entityId);
                if (client) {
                    this.serverProcessAction(client, message.action);
                }
            }
        }

        this.unprocessedMessages.length = 0;

        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i];
            client.tick(curTick - this.lastTick, curTick);
        }
        this.lastTick = curTick;
        this.sendWorldState();

    }


    serverProcessAction(client: PlayerEntity, message: Action) {
        switch (message.actionSubType) {
            case ActionSubType.Down: {
                client.lastDownAction[message.actionType] = message;
                break;
            }
            case ActionSubType.Up: {
                client.processServerUp(message);
                break;
            }
            case ActionSubType.None: {
                client.processAction(message);
                break;
            }
        }
    }

    getWorldState(): WorldState {
        return {
            entities: this.clients.map(c => ({
                id: c.id,
                x: c.x,
                y: c.y,
                lastDownAction: c.lastDownAction,
            })),
            currentTick: this.currentTick
        }
    }

    sendWorldState() {
        console.log('server, world state', JSON.stringify(this.getWorldState(), null, '\t'))
        for (let c = 0; c < this.clients.length; c++) {
            let client = this.clients[c];
            Socket.sendToClient(client.id, {messageType: 'worldState', state: this.getWorldState()})
        }
    }
}

export class Here {
    static start() {
    }
}


let server = new Server();


let clients: ClientGame[] = [];
let clientA = new ClientGame();
clientA.join();
clients.push(clientA);

let lastTick = +new Date();
setInterval(() => {
    let curTick = +new Date();
    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        client.tick(curTick - lastTick)
    }
    lastTick = curTick;
}, 1000);
setInterval(() => {
    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        client.draw()
    }
}, 1000);
setTimeout(() => {
    clients[0].liveEntity.pressLeft();
}, 1500);

setTimeout(() => {
    clients[0].liveEntity.releaseLeft();
}, 5700);

