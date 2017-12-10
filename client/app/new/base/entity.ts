import {Game} from "./game";
import {ClientGame} from "../client/clientGame";
import {Action, ActionSubType, ActionType, EnemyEntityOptions, EntityOptions, PlayerEntityOptions, SerializedEntity, ShotEntityOptions} from "./types";
import {Polygon} from "../utils/src/Collisions";
import {Utils} from "../utils/utils";

export abstract class GameEntity {
    polygon: Polygon;

    constructor(protected game: Game, options: EntityOptions) {
        this.id = options.id;
        this.x = options.x;
        this.y = options.y;
    }

    x: number;
    y: number;
    id: string;

    abstract serialize(): SerializedEntity;

    protected destroy() {
        this.game.entities.splice(this.game.entities.findIndex(a => a.id === this.id), 1);
    }

    abstract tick(timeSinceLastTick: number, currentServerTick: number): void;

    abstract collide(otherEntity: GameEntity): void;

    abstract draw(context: CanvasRenderingContext2D): void;
}

export class EnemyEntity extends GameEntity {
    private color: string;
    private health: number;

    constructor(protected game: Game, private options: EnemyEntityOptions) {
        super(game, options);
        this.color = options.color;
        this.health = options.health;
        this.polygon = new Polygon(this.x, this.y, [[-20, -20], [20, -20], [20, 20], [-20, 20]])
        this.polygon.entity = this;
        this.game.collisionEngine.insert(this.polygon);

    }

    tick(timeSinceLastTick: number, currentServerTick: number): void {
        this.polygon.x = this.x;
        this.polygon.y = this.y;
    }

    serialize(): SerializedEntity {
        return {
            type: "enemy",
            x: this.x,
            y: this.y,
            id: this.id,
            color: this.color,
            health: this.health
        };
    }

    collide(otherEntity: GameEntity) {

    }

    draw(context: CanvasRenderingContext2D) {
        let x = (this.x + 500 * 10) % 500;
        let y = (this.y + 500 * 10) % 500;

        context.fillStyle = this.color;
        context.fillRect(x - 20, y - 20, 40, 40);
    }

    hit(strength: number) {
        this.health -= strength;
        if (this.health <= 0) {
            this.destroy();
        }
    }
}


export class ShotEntity extends GameEntity {
    shotSpeedPerSecond: number;
    private initialY: number;
    ownerId?: string;
    tickCreated: number;
    private strength: number;

    constructor(protected game: Game, options: ShotEntityOptions) {
        super(game, options);

        this.strength = options.strength;
        this.ownerId = options.ownerId;
        this.tickCreated = options.tickCreated;
        this.initialY = options.initialY;
        this.shotSpeedPerSecond = options.shotSpeedPerSecond;
        this.polygon = new Polygon(this.x, this.y, [[-3, -3], [3, -3], [3, 3], [-3, 3]])
        this.polygon.entity = this;
        this.game.collisionEngine.insert(this.polygon);

    }

    tick(timeSinceLastTick: number, currentServerTick: number): void {
        if (currentServerTick - this.tickCreated > 10 * 1000) {
            this.destroy();
        } else {
            this.y = this.initialY - (currentServerTick - this.tickCreated) / 1000 * this.shotSpeedPerSecond;
        }
        /*
                for (let i = 0; i < this.game.entities.length; i++) {
                    let ent = this.game.entities[i];
                    if (ent instanceof PlayerEntity && ent.id !== this.ownerId) {
                        this.destroy();
                        break;
                    } else if (ent instanceof EnemyEntity) {
                        ent.hit(this.strength);
                        break;
                    }
                }
        */

    }

    collide(otherEntity: GameEntity) {

    }

    serialize(): SerializedEntity {
        return {
            type: "shot",
            x: this.x,
            y: this.y,
            id: this.id,
            strength: this.strength,
            tickCreated: this.tickCreated,
            ownerId: this.ownerId!,
            initialY: this.initialY,
            shotSpeedPerSecond: this.shotSpeedPerSecond,
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

    lastShotTick = 0;
    shotSpeedPerSecond = 0;

    protected speedPerSecond: number;
    protected color: string;
    protected shotStrength: number;
    protected shootEveryTick: number;
    lastDownAction: { [action: string]: Action } = {};

    serialize(): SerializedEntity {
        return {
            type: "player",
            x: this.x,
            y: this.y,
            id: this.id,
            lastDownAction: this.lastDownAction,
            speedPerSecond: this.speedPerSecond,
            color: this.color,
            shotStrength: this.shotStrength,
            shootEveryTick: this.shootEveryTick,
            shotSpeedPerSecond: this.shotSpeedPerSecond
        };
    }

    constructor(protected game: Game, options: PlayerEntityOptions) {
        super(game, options);
        this.shotStrength = options.shotStrength;
        this.shotSpeedPerSecond = options.shotSpeedPerSecond;
        this.color = options.color;
        this.speedPerSecond = options.speedPerSecond;
        this.shootEveryTick = options.shootEveryTick;

        this.polygon = new Polygon(this.x, this.y, [[-10, -10], [10, -10], [10, 10], [-10, 10]])
        this.polygon.entity = this;
        this.game.collisionEngine.insert(this.polygon);
    }

    collide(otherEntity: GameEntity) {

    }

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

                console.log({
                    tickCreated: shotTick,
                    x: shotX,
                    y: shotY,
                    ownerId: this.id,
                    initialY: shotY,
                    strength: this.shotStrength,
                    id: Utils.generateId(),
                    type: 'shot',
                    shotSpeedPerSecond: this.shotSpeedPerSecond
                });

                let shotEntity = new ShotEntity(this.game, {
                    tickCreated: shotTick,
                    x: shotX,
                    y: shotY,
                    ownerId: this.id,
                    initialY: shotY,
                    strength: this.shotStrength,
                    id: Utils.generateId(),
                    type: 'shot',
                    shotSpeedPerSecond: this.shotSpeedPerSecond
                });
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
                        ownerId: this.id,
                        initialY: shotY,
                        strength: this.shotStrength,
                        id: Utils.generateId(),
                        type: 'shot',
                        shotSpeedPerSecond: this.shotSpeedPerSecond,
                    });
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
    constructor(game: ClientGame, options: PlayerEntityOptions) {
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
                    ownerId: this.id,
                    initialY: shotY,
                    strength: this.shotStrength,
                    id: Utils.generateId(),
                    type: 'shot',
                    shotSpeedPerSecond: this.shotSpeedPerSecond,

                });
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