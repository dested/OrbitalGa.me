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
    lastLatency: number;
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

export class Utils {
    static generateId(): string {
        return (Math.random() * 100000).toFixed(0);
    }
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

export class ClientGame {
    private serverTick: number;
    private offsetTick: number;
    socketClient: SocketClient;
    private playerEntities: PlayerEntity[] = [];
    entities: GameEntity[] = [];

    get liveEntity(): PlayerEntity {
        return this.playerEntities.find(a => a.live)!;
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
                this.playerEntities.find(a => a.id === message.yourEntityId)!.live = true;
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
            let liveEntity = this.playerEntities.find(a => a.id === entity.id);
            if (!liveEntity) {
                liveEntity = new PlayerEntity(entity.id, this);
                liveEntity.x = entity.x;
                liveEntity.y = entity.y;
                this.playerEntities.push(liveEntity)
            }
            liveEntity.color = entity.color;
            if (state.resync) {
                liveEntity.x = entity.x;
                liveEntity.y = entity.y;
            }
        }
        for (let i = this.playerEntities.length - 1; i >= 0; i--) {
            let liveEntity = this.playerEntities[i];
            if (!state.entities.find(a => a.id === liveEntity.id)) {
                this.playerEntities.splice(i, 1);
            }
        }
    }

    tick(timeSinceLastTick: number) {

        for (let i = 0; i < this.unprocessedActions.length; i++) {
            let action = this.unprocessedActions[i];
            let entity = this.playerEntities.find(a => a.id === action.entityId);
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
        for (let i = 0; i < this.playerEntities.length; i++) {
            let entity = this.playerEntities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
        }
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
        }
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.liveEntity) {
            context.fillStyle = 'white';
            context.fillText(this.liveEntity.id.toString(), 0, 20);
        }
        for (let i = 0; i < this.playerEntities.length; i++) {
            let entity = this.playerEntities[i];
            entity.draw(context);
        }

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw(context);
        }
    }


    addEntity(entity: GameEntity) {
        this.entities.push(entity);
    }
}

export interface WorldState {
    entities: { x: number, color: string, y: number, id: string }[];
    currentTick: number;
    resync: boolean;
}

export abstract class GameEntity {
    constructor(private game: ClientGame, options: { tickCreated: number; x: number; y: number; ownerId: string }) {
        this.id = Utils.generateId();
        this.x = options.x;
        this.y = options.y;
        this.ownerId = options.ownerId;
        this.tickCreated = options.tickCreated;
    }

    x: number;
    y: number;
    id: string;
    ownerId: string;
    tickCreated: number;

    protected destroy() {
        this.game.entities.splice(this.game.entities.findIndex(a => a.id === this.id), 1);
    }

    abstract tick(timeSinceLastTick: number, currentServerTick: number): void;

    abstract draw(context: CanvasRenderingContext2D): void;
}

export class ShotEntity extends GameEntity {
    static shotSpeedPerSecond = 500;

    tick(timeSinceLastTick: number, currentServerTick: number): void {
        if (currentServerTick - this.tickCreated > 10 * 1000) {
            this.destroy();
        } else {
            this.y -= timeSinceLastTick / 1000 * ShotEntity.shotSpeedPerSecond;
        }
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = 'yellow';
        context.fillRect(this.x - 3, this.y - 3, 6, 6);
    }
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

    pressingShoot = false;
    wasPressingShoot = false;

    pressingUp = false;
    pressingDown = false;
    wasPressingUp = false;
    wasPressingDown = false;


    pressLeft() {
        if (this.pressingRight) return;
        this.pressingLeft = true;
    }

    pressRight() {
        if (this.pressingLeft) return;
        this.pressingRight = true;
    }

    releaseLeft() {
        this.pressingLeft = false;
    }

    releaseRight() {
        this.pressingRight = false;
    }

    pressUp() {
        if (this.pressingDown) return;
        this.pressingUp = true;
    }

    pressDown() {
        if (this.pressingUp) return;
        this.pressingDown = true;
    }

    releaseUp() {
        this.pressingUp = false;
    }


    releaseDown() {
        this.pressingDown = false;
    }

    pressShoot() {
        this.pressingShoot = true;
    }

    releaseShoot() {
        this.pressingShoot = false;
    }

    tick(timeSinceLastTick: number, currentServerTick: number, isServer: boolean = false) {
        if (!this.live) {

            if (this.lastDownAction[ActionType.Shoot]) {
                let shotEntity = new ShotEntity(this.game, {
                    tickCreated: currentServerTick,
                    x: this.x,
                    y: this.y,
                    ownerId: this.id
                });
                this.game.addEntity(shotEntity)
            }


            if (this.lastDownAction[ActionType.Left]) {
                this.x -= timeSinceLastTick / 1000 * this.speedPerSecond;
            }

            if (this.lastDownAction[ActionType.Right]) {
                this.x += timeSinceLastTick / 1000 * this.speedPerSecond;
            }

            if (this.lastDownAction[ActionType.Up]) {
                this.y -= timeSinceLastTick / 1000 * this.speedPerSecond;
            }
            if (this.lastDownAction[ActionType.Down]) {
                this.y += timeSinceLastTick / 1000 * this.speedPerSecond;
            }

        } else {

            if (this.pressingShoot) {
                if (!this.wasPressingShoot) {
                    this.game.sendAction({
                        actionType: ActionType.Shoot,
                        actionSubType: ActionSubType.Down,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingShoot = true;
                }
                let shotEntity = new ShotEntity(this.game, {
                    tickCreated: currentServerTick,
                    x: this.x,
                    y: this.y,
                    ownerId: this.id
                });
                this.game.addEntity(shotEntity)
            }

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

            if (!this.pressingShoot) {
                if (this.wasPressingShoot) {
                    this.game.sendAction({
                        actionType: ActionType.Shoot,
                        actionSubType: ActionSubType.Up,
                        x: this.x,
                        y: this.y,
                        entityId: this.id
                    });
                    this.wasPressingShoot = false;
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
        context.fillRect(x - 10, y - 10, 20, 20);
    }


    processServerUp(message: Action, isServer: boolean = false): boolean {
        let lastDown = this.lastDownAction[message.actionType];
        if (!lastDown) return false;
        let tickDiff = message.actionTick! - lastDown.actionTick!;
        switch (message.actionType) {
            case ActionType.Left:
                this.x = lastDown.x - tickDiff / 1000 * this.speedPerSecond;
                break;
            case ActionType.Right:
                this.x = lastDown.x + tickDiff / 1000 * this.speedPerSecond;
                break;
            case ActionType.Up:
                this.y = lastDown.y - tickDiff / 1000 * this.speedPerSecond;
                break;
            case ActionType.Down:
                this.y = lastDown.y + tickDiff / 1000 * this.speedPerSecond;
                break;
        }
        delete this.lastDownAction[message.actionType];
        return true;
    }

    processAction(message: Action): boolean {
        switch (message.actionType) {
            case ActionType.Bomb:
                break;
        }
        return true;
    }
}

export class Server {

    private clients: PlayerEntity[] = [];
    private startingTick: number;
    private unprocessedMessages: ServerMessage[] = [];
    private static resyncInterval: number = 1000;

    private lastResyncTick: number = 0;
    private game: ClientGame;

    get currentTick(): number {
        return +new Date() - this.startingTick;
    }

    constructor() {
        this.startingTick = +new Date();
        this.game = new ClientGame();
        Socket.createServer((clientId, message) => {
            this.unprocessedMessages.push(message);
        }, (client) => {
            let newClient = new PlayerEntity(client.id, this.game);
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
                    if (this.serverProcessAction(client, message.action)) {
                        for (let c = 0; c < this.clients.length; c++) {
                            let otherClient = this.clients[c];
                            if (client.id !== otherClient.id) {
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
        for (let i = 0; i < this.game.entities.length; i++) {
            let entity = this.game.entities[i];
            entity.tick(curTick - this.lastTick, curTick);
        }

        this.lastTick = curTick;
        this.sendWorldState();
    }


    serverProcessAction(client: PlayerEntity, message: Action): boolean {
        switch (message.actionSubType) {
            case ActionSubType.Down: {
                if (message.actionType === ActionType.Left && client.lastDownAction[ActionType.Right]) {
                    return false;
                }
                if (message.actionType === ActionType.Right && client.lastDownAction[ActionType.Left]) {
                    return false;
                }
                if (message.actionType === ActionType.Down && client.lastDownAction[ActionType.Up]) {
                    return false;
                }
                if (message.actionType === ActionType.Up && client.lastDownAction[ActionType.Down]) {
                    return false;
                }
                client.lastDownAction[message.actionType] = message;
                return true;
            }
            case ActionSubType.Up: {
                return client.processServerUp(message, true);
            }
            case ActionSubType.None: {
                return client.processAction(message);
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

        for (let i = 0; i < this.game.entities.length; i++) {
            let entity = this.game.entities[i];
            entity.draw(context);
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

for (let i = 0; i < 7; i++) {
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
    if (e.keyCode === 65) {
        clients[clientInd].liveEntity.pressShoot();
    }
    if (e.shiftKey) {
        runSim = !runSim;
        if (!runSim) {
            for (let i = 0; i < clients.length; i++) {
                let client = clients[i];
                client.liveEntity.releaseLeft();
                client.liveEntity.releaseRight();
                client.liveEntity.releaseUp();
                client.liveEntity.releaseDown();
            }

        }
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
    if (e.keyCode === 65) {
        clients[clientInd].liveEntity.releaseShoot();
    }
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


/*

collisions
firing bullets
firing bombs


*/