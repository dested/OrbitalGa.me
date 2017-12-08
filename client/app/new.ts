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

export class Game {
    protected serverTick: number;
    protected offsetTick: number;
    public entities: GameEntity[] = [];

    public get playerEntities(): PlayerEntity[] {
        return this.entities
            .filter(a => a instanceof PlayerEntity)
            .map(a => a as PlayerEntity);
    }

    constructor() {
    }

    unprocessedActions: Action[] = [];

    get currentServerTick() {
        return this.serverTick + (+new Date() - this.offsetTick);
    }


    tick(timeSinceLastTick: number) {
        for (let i = 0; i < this.unprocessedActions.length; i++) {
            let action = this.unprocessedActions[i];
            let entity = this.entities.find(a => a.id === action.entityId) as PlayerEntity;
            if (entity) {
                entity.handleAction(action);
            }
        }

        this.unprocessedActions.length = 0;

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
        }
    }


    addEntity(entity: GameEntity) {
        this.entities.push(entity);
    }
}


export class ServerGame extends Game {
    private lastResyncTick: number;

    serverTick: number = 0;
    offsetTick: number = +new Date();

    tick(timeSinceLastTick: number) {
        for (let i = 0; i < this.unprocessedActions.length; i++) {
            let action = this.unprocessedActions[i];
            let entity = this.playerEntities.find(a => a.id === action.entityId);
            if (entity) {
                if (entity.handleAction(action)) {
                    for (let otherClient of this.playerEntities) {
                        if (entity.id !== otherClient.id) {
                            Socket.sendToClient(otherClient.id, {action: action, messageType: 'action'})
                        }
                    }
                }
            }
        }

        this.unprocessedActions.length = 0;

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
        }
        this.sendWorldState();
    }

    getWorldState(resync: boolean): WorldState {
        return {
            entities: this.playerEntities
                .map(c => ({
                    id: c.id,
                    color: c.color,
                    x: c.x,
                    y: c.y,
                    lastDownAction: c.lastDownAction,
                    type: 'player' as 'player'
                })),
            currentTick: this.currentServerTick,
            resync: resync
        }
    }

    sendWorldState() {
        // let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
        let shouldResync = false;
        if (shouldResync) {
            this.lastResyncTick = this.currentServerTick;
        }
        for (let client of this.playerEntities) {
            Socket.sendToClient(client.id, {messageType: 'worldState', state: this.getWorldState(shouldResync)})
        }
    }

    debugDraw(context: CanvasRenderingContext2D) {
        context.fillText((Math.round(this.currentServerTick / 100) * 100).toFixed(0), 400, 20);
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw(context);
        }
    }
}


export class ClientGame extends Game {
    socketClient: SocketClient;

    get liveEntity(): LivePlayerEntity {
        return this.entities.find(a => a instanceof LivePlayerEntity) as LivePlayerEntity;
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
                this.setServerState(message.state, message.yourEntityId);
                break;
            case "worldState":
                this.setServerState(message.state);
                break;
            case "action":
                this.unprocessedActions.push(message.action);
                break;
        }
    }

    private setServerState(state: WorldState, myEntityId?: string) {
        for (let i = 0; i < state.entities.length; i++) {
            let entity = state.entities[i];
            let liveEntity = this.entities.find(a => a.id === entity.id);

            switch (entity.type) {
                case "player": {
                    if (!liveEntity) {
                        if (myEntityId === entity.id) {
                            liveEntity = new LivePlayerEntity(this, {tickCreated: 0, x: entity.x, y: entity.y});
                        } else {
                            liveEntity = new PlayerEntity(this, {tickCreated: 0, x: entity.x, y: entity.y});
                        }
                        liveEntity.id = entity.id;
                        this.entities.push(liveEntity)
                    }
                    (liveEntity as PlayerEntity).lastDownAction = entity.lastDownAction;
                    (liveEntity as PlayerEntity).color = entity.color;
                    break;
                }
            }
            if (liveEntity) {
                if (state.resync) {
                    liveEntity.x = entity.x;
                    liveEntity.y = entity.y;
                }
            }
        }
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let entity = this.entities[i];
            if (entity instanceof PlayerEntity && !state.entities.find(a => a.id === entity.id)) {
                this.entities.splice(i, 1);
            }
        }
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = 'white';
        if (this.liveEntity) {
            context.fillText(this.liveEntity.id.toString(), 0, 20);
            context.fillText((Math.round(this.currentServerTick / 100) * 100).toFixed(0), 400, 20);
        }
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.draw(context);
        }
    }
}


export interface WorldState {
    entities: { lastDownAction: { [action: string]: Action }; x: number, color: string, y: number, id: string, type: 'player' }[];
    currentTick: number;
    resync: boolean;
}

export abstract class GameEntity {
    constructor(protected game: Game, options: { tickCreated: number; x: number; y: number; ownerId?: string }) {
        this.id = Utils.generateId();
        this.x = options.x;
        this.y = options.y;
        this.ownerId = options.ownerId;
        this.tickCreated = options.tickCreated;
    }

    x: number;
    y: number;
    id: string;
    ownerId?: string;
    tickCreated: number;

    protected destroy() {
        this.game.entities.splice(this.game.entities.findIndex(a => a.id === this.id), 1);
    }

    abstract tick(timeSinceLastTick: number, currentServerTick: number): void;

    abstract draw(context: CanvasRenderingContext2D): void;
}

export class ShotEntity extends GameEntity {
    shotSpeedPerSecond = 500;

    tick(timeSinceLastTick: number, currentServerTick: number): void {
        if (currentServerTick - this.tickCreated > 10 * 1000) {
            this.destroy();
        } else {
            this.y -= timeSinceLastTick / 1000 * this.shotSpeedPerSecond;
        }
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = 'yellow';
        context.fillRect(this.x - 3, this.y - 3, 6, 6);
    }
}

export class PlayerEntity extends GameEntity {

    speedPerSecond: number = 100;
    color: string;

    tick(timeSinceLastTick: number, currentServerTick: number, isServer: boolean = false) {
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


    processActionUp(message: Action): boolean {
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
                this.color = 'red';
                break;
        }
        return true;
    }

    processActionDown(message: Action): boolean {
        if (message.actionType === ActionType.Left && this.lastDownAction[ActionType.Right]) {
            return false;
        }
        if (message.actionType === ActionType.Right && this.lastDownAction[ActionType.Left]) {
            return false;
        }
        if (message.actionType === ActionType.Down && this.lastDownAction[ActionType.Up]) {
            return false;
        }
        if (message.actionType === ActionType.Up && this.lastDownAction[ActionType.Down]) {
            return false;
        }
        this.lastDownAction[message.actionType] = message;
        return true;
    }

    handleAction(message: Action): boolean {
        switch (message.actionSubType) {
            case ActionSubType.Down: {
                return this.processActionDown(message)
            }
            case ActionSubType.Up: {
                return this.processActionUp(message);
            }
            case ActionSubType.None: {
                return this.processAction(message);
            }
        }
        return false;
    }

}


export class LivePlayerEntity extends PlayerEntity {
    constructor(game: ClientGame, options: { tickCreated: number; x: number; y: number; ownerId?: string }) {
        super(game, options)
    }

    game: ClientGame;

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

export class Server {

    game: ServerGame;


    constructor() {
        this.game = new ServerGame();
        Socket.createServer((clientId, message) => {
            if (message.messageType === 'action') {
                this.game.unprocessedActions.push(message.action);
            }
        }, (client) => {
            let newPlayer = new PlayerEntity(this.game,
                {
                    tickCreated: this.game.currentServerTick,
                    x: parseInt((Math.random() * 500).toFixed()),
                    y: parseInt((Math.random() * 500).toFixed())
                }
            );
            newPlayer.id = client.id;
            newPlayer.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
            this.game.entities.push(newPlayer);
            Socket.sendToClient(client.id, {
                messageType: "start",
                yourEntityId: client.id,
                serverTick: this.game.currentServerTick,
                state: this.game.getWorldState(true)
            });

            for (let player of this.game.playerEntities) {
                if (player !== newPlayer) {
                    Socket.sendToClient(client.id, {messageType: 'worldState', state: this.game.getWorldState(true)})
                }
            }

        });

        setInterval(() => {
            let curTick = +new Date();
            this.game.tick(curTick - this.lastTick);
            this.lastTick = curTick;
        }, 100);
    }

    lastTick = +new Date();
}

export class Here {
    static start() {
    }
}


let server = new Server();


let clients: ClientGame[] = [];
let contexts: CanvasRenderingContext2D[] = [];

let canvas = document.createElement("canvas");
canvas.style.border = 'solid 2px red';
canvas.height = canvas.width = 500;
contexts.push(canvas.getContext('2d')!);
document.body.appendChild(canvas);


setInterval(() => {
    let client = new ClientGame();
    client.join();
    clients.push(client);
    let canvas = document.createElement("canvas");
    canvas.style.border = 'solid 2px white';
    canvas.height = canvas.width = 500;
    contexts.push(canvas.getContext('2d')!);
    document.body.appendChild(canvas)
}, Math.random() * 5000 + 1000);


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

    contexts[0].clearRect(0, 0, 500, 500);
    server.game.debugDraw(contexts[0]);

    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        contexts[i + 1].clearRect(0, 0, 500, 500);
        client.draw(contexts[i + 1]);
    }
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
}, 500);


/*

collisions
firing bullets
firing bombs


*/