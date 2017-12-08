enum ActionType {
    Left = "left",
    Right = "right",
    Up = "up",
    Down = "down",
    Shoot = "shoot",
    Bomb = "bomb"
}

enum ActionSubType {
    None = "none",
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
    messages: string[];
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

    static ClientLatency = 1000;
    static ServerLatency = 1000;

    public static sockets: SocketClient[] = [];
    private static onServerMessage: (clientId: string, message: ServerMessage) => void;

    static onClientJoin: (client: SocketClient) => void;

    static clientJoin(onMessage: (message: ServerMessage) => void) {
        let client = {
            id: (Math.random() * 100000).toFixed(0),
            messages: [],
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
            this.lastLatency = this.lastLatency + Math.random() * this.ServerLatency;
        } else {
            this.lastLatency = +new Date() + Math.random() * this.ServerLatency;
        }

        setTimeout(() => {
            // console.log('send to server', JSON.stringify(message));
            this.onServerMessage(clientId, JSON.parse(JSON.stringify(msg)));
        }, +new Date() - this.lastLatency);
    }

    static sendToClient(clientId: string, message: ServerMessage) {
        let client = this.sockets.find(a => a.id === clientId);
        let msg = JSON.stringify(message);

        function send() {
            setTimeout(() => {
                // console.log('send to client', JSON.stringify(message));
                if (client!.messages.length > 0) {
                    client!.onMessage(JSON.parse(client!.messages[0]));
                    client!.messages.splice(0, 1);
                    send();
                }
            }, Math.random() * Socket.ClientLatency);
        }

        if (client) {
            client.messages.push(msg);
            send();

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
                liveEntity.x = entity.x;
                liveEntity.y = entity.y;
                this.entities.push(liveEntity)
            }

            liveEntity.lastDownAction = entity.lastDownAction;
            liveEntity.color = entity.color;
            if (state.resync) {
                liveEntity.x = entity.x;
                liveEntity.y = entity.y;
            }
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

    draw(context: CanvasRenderingContext2D) {
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw(context);
        }
    }
}


export interface WorldState {
    entities: { x: number, color: string, y: number, lastDownAction: { [action: string]: Action }, id: string }[];
    currentTick: number;
    resync: boolean;
}

export class PlayerEntity {
    live: boolean = false;

    constructor(public id: string, private game: ClientGame) {
    }

    x: number = 0;
    y: number = 0;

    speedPerSecond: number = 100;
    color: string;

    pressingLeft = false;
    pressingRight = false;
    wasPressingLeft = false;
    wasPressingRight = false;

    pressingUp = false;
    pressingDown = false;
    wasPressingUp = false;
    wasPressingDown = false;


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

    pressUp() {
        this.pressingUp = true;
    }

    pressDown() {
        this.pressingDown = true;
    }

    releaseUp() {
        this.pressingUp = false;
    }

    releaseDown() {
        this.pressingDown = false;
    }


    tick(timeSinceLastTick: number, currentServerTick: number, isServer: boolean = false) {
        if (!this.live) {
            if (this.lastDownAction[ActionType.Left]) {
                let last = this.lastDownAction[ActionType.Left];
                this.x -= timeSinceLastTick / 1000 * this.speedPerSecond;
                // last.actionTick = currentServerTick;
                last.x = this.x;
                last.y = this.y;
            }
            if (this.lastDownAction[ActionType.Right]) {
                let last = this.lastDownAction[ActionType.Right];
                this.x += timeSinceLastTick / 1000 * this.speedPerSecond;
                // last.actionTick = currentServerTick;
                last.x = this.x;
                last.y = this.y;
            }

            if (this.lastDownAction[ActionType.Up]) {
                let last = this.lastDownAction[ActionType.Up];
                this.y -= timeSinceLastTick / 1000 * this.speedPerSecond;

                // last.actionTick = currentServerTick;
                last.x = this.x;
                last.y = this.y;
            }
            if (this.lastDownAction[ActionType.Down]) {
                let last = this.lastDownAction[ActionType.Down];
                this.y += timeSinceLastTick / 1000 * this.speedPerSecond;
                // last.actionTick = currentServerTick;
                last.x = this.x;
                last.y = this.y;
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
            }
            if (this.pressingRight) {
                if (!this.wasPressingRight) {
                    this.game.sendAction({
                        actionType: ActionType.Right,
                        actionSubType: ActionSubType.Down,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingRight = true;
                }
                this.x += timeSinceLastTick / 1000 * this.speedPerSecond;
            }

            if (this.pressingUp) {
                if (!this.wasPressingUp) {
                    this.game.sendAction({
                        actionType: ActionType.Up,
                        actionSubType: ActionSubType.Down,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingUp = true;
                }
                this.y -= timeSinceLastTick / 1000 * this.speedPerSecond;
            }
            if (this.pressingDown) {
                if (!this.wasPressingDown) {
                    this.game.sendAction({
                        actionType: ActionType.Down,
                        actionSubType: ActionSubType.Down,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingDown = true;
                }
                this.y += timeSinceLastTick / 1000 * this.speedPerSecond;
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
            }
            if (!this.pressingRight) {
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

            if (!this.pressingUp) {
                if (this.wasPressingUp) {
                    this.game.sendAction({
                        actionType: ActionType.Up,
                        actionSubType: ActionSubType.Up,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingUp = false;
                }
            }
            if (!this.pressingDown) {
                if (this.wasPressingDown) {
                    this.game.sendAction({
                        actionType: ActionType.Down,
                        actionSubType: ActionSubType.Up,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingDown = false;
                }
            }
        }
    }


    lastDownAction: { [action: string]: Action } = {};


    draw(context: CanvasRenderingContext2D) {
        let x = (this.x + 500 * 10) % 500;
        let y = (this.y + 500 * 10) % 500;
        context.fillStyle = 'white';
        context.font = "20px Arial";
        context.fillText(`${this.x.toFixed()},${this.y.toFixed()}`, x, y - 10);
        context.fillStyle = this.color;
        context.fillRect(x, y, 20, 20);
    }


    processServerUp(message: Action, isServer: boolean = false) {
        let lastDown = this.lastDownAction[message.actionType];
        switch (message.actionType) {
            case ActionType.Left:
                this.x = message.x;
                break;
            case ActionType.Right:
                this.x = message.x;
                break;
            case ActionType.Up:
                this.y = message.y;
                break;
            case ActionType.Down:
                this.y = message.y;
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
    private static resyncInterval: number = 1000;

    private lastResyncTick: number = 0;

    get currentTick(): number {
        return +new Date() - this.startingTick;
    }

    constructor() {
        this.startingTick = +new Date();

        Socket.createServer((clientId, mesasage) => {
            this.unprocessedMessages.push(mesasage);
        }, (client) => {
            let newClient = new PlayerEntity(client.id, null!);
            newClient.x = parseInt((Math.random() * 500).toFixed());
            newClient.y = parseInt((Math.random() * 500).toFixed());
            newClient.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
            this.clients.push(newClient);
            Socket.sendToClient(client.id, {
                messageType: "start",
                yourEntityId: client.id,
                serverTick: this.currentTick,
                state: this.getWorldState(true)
            });
            for (let c = 0; c < this.clients.length; c++) {
                let client = this.clients[c];
                if (client !== newClient) {
                    Socket.sendToClient(client.id, {messageType: 'worldState', state: this.getWorldState(true)})
                }
            }

        });

        setInterval(() => {
            this.process();
        }, 100);
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
                    if (message.action.actionSubType !== ActionSubType.Down) {
                        for (let c = 0; c < this.clients.length; c++) {
                            let otherClient = this.clients[c];
                            if (client !== otherClient) {
                                Socket.sendToClient(otherClient.id, message)
                            }
                        }
                    }
                }
            }
        }

        this.unprocessedMessages.length = 0;

        for (let i = 0; i < this.clients.length; i++) {
            let client = this.clients[i];
            client.tick(curTick - this.lastTick, curTick, true);
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
                client.processServerUp(message, true);
                break;
            }
            case ActionSubType.None: {
                client.processAction(message);
                break;
            }
        }
    }

    getWorldState(resync: boolean): WorldState {
        return {
            entities: this.clients.map(c => ({
                id: c.id,
                color: c.color,
                x: c.x,
                y: c.y,
                lastDownAction: c.lastDownAction,
            })),
            currentTick: this.currentTick,
            resync: resync
        }
    }

    sendWorldState() {
        let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
        shouldResync = false;
        if (shouldResync) {
            this.lastResyncTick = this.currentTick;
        }
        // console.log(JSON.stringify(this.getWorldState()));
        for (let c = 0; c < this.clients.length; c++) {
            let client = this.clients[c];
            Socket.sendToClient(client.id, {messageType: 'worldState', state: this.getWorldState(shouldResync)})
        }
    }

    draw(context: CanvasRenderingContext2D) {
        for (let c = 0; c < this.clients.length; c++) {
            let client = this.clients[c];
            client.draw(context);
        }
    }
}

export class Here {
    static start() {
    }
}


let server = new Server();


let clients: ClientGame[] = [];
let contexts: CanvasRenderingContext2D[] = [];

for (let i = 0; i < 2; i++) {
    let client = new ClientGame();
    client.join();
    clients.push(client);
    let canvas = document.createElement("canvas");
    canvas.style.border = 'solid 2px white';
    canvas.height = canvas.width = 500;
    contexts.push(canvas.getContext('2d')!);
    document.body.appendChild(canvas)
}
let canvas = document.createElement("canvas");
canvas.style.border = 'solid 2px red';
canvas.height = canvas.width = 500;
contexts.push(canvas.getContext('2d')!);
document.body.appendChild(canvas);


let lastTick = +new Date();
setInterval(() => {
    let curTick = +new Date();
    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        client.tick(curTick - lastTick)
    }
    lastTick = curTick;
}, 16);
setInterval(() => {
    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        contexts[i].clearRect(0, 0, 500, 500);
        client.draw(contexts[i]);
    }
    contexts[clients.length].clearRect(0, 0, 500, 500);
    server.draw(contexts[clients.length]);
}, 16);
let clientInd = 0;
let runSim = false;
document.onkeydown = (e) => {
    if (e.shiftKey) {
        runSim = !runSim;
    }

    if (e.ctrlKey) {
        clientInd = (clientInd + 1) % clients.length;
    }
    if (e.keyCode === 38) {
        clients[clientInd].liveEntity.pressUp();
    } else if (e.keyCode === 40) {
        clients[clientInd].liveEntity.pressDown();
    } else if (e.keyCode === 37) {
        clients[clientInd].liveEntity.pressLeft();
    } else if (e.keyCode === 39) {
        clients[clientInd].liveEntity.pressRight();
    }
};
document.onkeyup = (e) => {
    if (e.keyCode === 38) {
        clients[clientInd].liveEntity.releaseUp();
    } else if (e.keyCode === 40) {
        clients[clientInd].liveEntity.releaseDown();
    } else if (e.keyCode === 37) {
        clients[clientInd].liveEntity.releaseLeft();
    } else if (e.keyCode === 39) {
        clients[clientInd].liveEntity.releaseRight();
    }
};

setInterval(() => {
    if (!runSim) return;
    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];

        if (Math.random() * 1000 < 50) {
            if (client.liveEntity.pressingLeft)
                client.liveEntity.releaseLeft();
            else
                client.liveEntity.pressLeft();
        } else {
            if (Math.random() * 1000 < 50) {
                if (client.liveEntity.pressingRight)
                    client.liveEntity.releaseRight();
                else
                    client.liveEntity.pressRight();
            }
        }
        if (Math.random() * 1000 < 50) {
            if (client.liveEntity.pressingUp)
                client.liveEntity.releaseUp();
            else
                client.liveEntity.pressUp();
        } else {
            if (Math.random() * 1000 < 50) {
                if (client.liveEntity.pressingDown)
                    client.liveEntity.releaseDown();
                else
                    client.liveEntity.pressDown();
            }
        }
    }
}, 500)

