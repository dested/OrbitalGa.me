import {GameEntity, PlayerEntity} from "./entity";
import {Action} from "../socket";

export class Game {
    protected serverTick: number = 0;
    protected offsetTick: number = +new Date();

    public entities: GameEntity[] = [];

    public get playerEntities(): PlayerEntity[] {
        return this.entities
            .filter(a => a instanceof PlayerEntity)
            .map(a => a as PlayerEntity);
    }

    public get nonPlayerEntities(): GameEntity[] {
        return this.entities
            .filter(a => !(a instanceof PlayerEntity));
    }

    // public world:GameWord;

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
