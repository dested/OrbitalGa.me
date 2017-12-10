import {Game} from "./game";
import {Utils} from "../utils";
import {Action, ActionSubType, ActionType, SerializedEntity} from "../socket";
import {ClientGame} from "../client/clientGame";

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

    abstract serialize(): SerializedEntity;

    protected destroy() {
        this.game.entities.splice(this.game.entities.findIndex(a => a.id === this.id), 1);
    }

    abstract tick(timeSinceLastTick: number, currentServerTick: number): void;

    abstract draw(context: CanvasRenderingContext2D): void;
}


export class ShotEntity extends GameEntity {
    shotSpeedPerSecond = 500;

    constructor(protected game: Game, options: { tickCreated: number; x: number; y: number; ownerId?: string }, private initialY: number) {
        super(game, options);
    }

    tick(timeSinceLastTick: number, currentServerTick: number): void {
        if (currentServerTick - this.tickCreated > 10 * 1000) {
            this.destroy();
        } else {
            this.y = this.initialY - (currentServerTick - this.tickCreated) / 1000 * this.shotSpeedPerSecond;
        }
    }

    serialize(): SerializedEntity {
        return {
            type: "shot",
            x: this.x,
            y: this.y,
            id: this.id,
            tickCreated: this.tickCreated,
            ownerId: this.ownerId!,
            initialY: this.initialY
        };
    }

    draw(context: CanvasRenderingContext2D) {
        let x = (this.x + 500 * 10) % 500;
        let y = this.y;


        context.fillStyle = 'yellow';
        context.fillRect(x - 3, y - 3, 6, 6);
    }
}

export class PlayerEntity extends GameEntity {

    speedPerSecond: number = 100;
    color: string;

    serialize(): SerializedEntity {
        return {
            type: "player",
            x: this.x,
            y: this.y,
            id: this.id,
            lastDownAction: this.lastDownAction,
            color: this.color
        };
    }

    shootEveryTick = 100;
    lastShotTick = 0;


    tick(timeSinceLastTick: number, currentServerTick: number) {
        if (this.lastDownAction[ActionType.Shoot]) {
            for (let shotTick = this.lastShotTick + this.shootEveryTick; shotTick < currentServerTick; shotTick += this.shootEveryTick) {

                let shotX = this.x;
                let shotY = this.y;

                if (this.lastDownAction[ActionType.Left]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Left].actionTick;
                    shotX = this.lastDownAction[ActionType.Left].x - tickDiff / 1000 * this.speedPerSecond
                }
                else if (this.lastDownAction[ActionType.Right]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Right].actionTick;
                    shotX = this.lastDownAction[ActionType.Right].x + tickDiff / 1000 * this.speedPerSecond
                }
                if (this.lastDownAction[ActionType.Up]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Up].actionTick;
                    shotY = this.lastDownAction[ActionType.Up].y - tickDiff / 1000 * this.speedPerSecond
                }
                else if (this.lastDownAction[ActionType.Down]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Down].actionTick;
                    shotY = this.lastDownAction[ActionType.Down].y + tickDiff / 1000 * this.speedPerSecond
                }

                let shotEntity = new ShotEntity(this.game, {
                    tickCreated: shotTick,
                    x: shotX,
                    y: shotY,
                    ownerId: this.id
                }, shotY);
                this.game.addEntity(shotEntity);

                this.lastShotTick = shotTick;
            }

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
        let tickDiff = message.actionTick - lastDown.actionTick;
        switch (message.actionType) {
            case ActionType.Left:
                this.x = lastDown.x - tickDiff / 1000 * this.speedPerSecond;
                break;
            case ActionType.Shoot:

                for (let shotTick = this.lastShotTick + this.shootEveryTick; shotTick < this.game.currentServerTick; shotTick += this.shootEveryTick) {

                    let shotX = this.x;
                    let shotY = this.y;

                    if (this.lastDownAction[ActionType.Left]) {
                        let tickDiff = shotTick - this.lastDownAction[ActionType.Left].actionTick;
                        shotX = this.lastDownAction[ActionType.Left].x - tickDiff / 1000 * this.speedPerSecond
                    }
                    else if (this.lastDownAction[ActionType.Right]) {
                        let tickDiff = shotTick - this.lastDownAction[ActionType.Right].actionTick;
                        shotX = this.lastDownAction[ActionType.Right].x + tickDiff / 1000 * this.speedPerSecond
                    }
                    if (this.lastDownAction[ActionType.Up]) {
                        let tickDiff = shotTick - this.lastDownAction[ActionType.Up].actionTick;
                        shotY = this.lastDownAction[ActionType.Up].y - tickDiff / 1000 * this.speedPerSecond
                    }
                    else if (this.lastDownAction[ActionType.Down]) {
                        let tickDiff = shotTick - this.lastDownAction[ActionType.Down].actionTick;
                        shotY = this.lastDownAction[ActionType.Down].y + tickDiff / 1000 * this.speedPerSecond
                    }

                    let shotEntity = new ShotEntity(this.game, {
                        tickCreated: shotTick,
                        x: shotX,
                        y: shotY,
                        ownerId: this.id
                    }, shotY);
                    this.game.addEntity(shotEntity);
                }

                this.lastShotTick = 0;


                //todo destroy any unduly created shots
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

    processActionOther(message: Action): boolean {
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
        if (message.actionType === ActionType.Shoot) {
            this.lastShotTick = this.lastDownAction[ActionType.Shoot].actionTick + this.lastDownAction[ActionType.Shoot].actionTick % this.shootEveryTick;
        }
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
            case ActionSubType.Other: {
                return this.processActionOther(message);
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
                });
                this.lastShotTick = currentServerTick + currentServerTick % this.shootEveryTick;
                this.wasPressingShoot = true;
            }


            for (let shotTick = this.lastShotTick + this.shootEveryTick; shotTick < currentServerTick; shotTick += this.shootEveryTick) {

                let shotX = this.x;
                let shotY = this.y;

                if (this.lastDownAction[ActionType.Left]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Left].actionTick;
                    shotX = this.lastDownAction[ActionType.Left].x - tickDiff / 1000 * this.speedPerSecond
                }
                else if (this.lastDownAction[ActionType.Right]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Right].actionTick;
                    shotX = this.lastDownAction[ActionType.Right].x + tickDiff / 1000 * this.speedPerSecond
                }
                if (this.lastDownAction[ActionType.Up]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Up].actionTick;
                    shotY = this.lastDownAction[ActionType.Up].y - tickDiff / 1000 * this.speedPerSecond
                }
                else if (this.lastDownAction[ActionType.Down]) {
                    let tickDiff = shotTick - this.lastDownAction[ActionType.Down].actionTick;
                    shotY = this.lastDownAction[ActionType.Down].y + tickDiff / 1000 * this.speedPerSecond
                }

                let shotEntity = new ShotEntity(this.game, {
                    tickCreated: shotTick,
                    x: shotX,
                    y: shotY,
                    ownerId: this.id
                }, shotY);
                this.game.addEntity(shotEntity);
                this.lastShotTick = shotTick;
            }
        }

        if (this.pressingLeft) {
            if (!this.wasPressingLeft) {
                this.game.sendAction({
                    actionType: ActionType.Left,
                    actionSubType: ActionSubType.Down,
                    x: this.x,
                    y: this.y,
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
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
                    entityId: this.id,
                    actionTick: this.game.currentServerTick
                });
                this.wasPressingDown = false;
            }
        }
    }
}