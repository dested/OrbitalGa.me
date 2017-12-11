import {GameEntity, PlayerEntity} from "./entity";
import {Action} from "./types";
import Collisions,{Result} from "../utils/src/Collisions";

export class Game {
    protected serverTick: number = 0;
    protected offsetTick: number = +new Date();
    public collisionEngine: Collisions;
    public entities: GameEntity[] = [];
    private collisionResult: Result;

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
        this.collisionEngine = new Collisions();
        this.collisionResult = this.collisionEngine.createResult();
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
                entity.handleAction(action, this.currentServerTick);
            }
        }

        this.unprocessedActions.length = 0;

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            entity.tick(timeSinceLastTick, this.currentServerTick);
            entity.updatePolygon();
        }
        this.checkCollisions();
    }

    protected checkCollisions() {

        this.collisionEngine.update();

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            const potentials = entity.polygon!.potentials();
            for (const body of potentials) {

                if (entity.polygon && entity.polygon.collides(body, this.collisionResult)) {
                    if (entity.collide((body as any).entity,this.collisionResult)) {
                        break;
                    }
                }
            }
        }
    }

    addEntity(entity: GameEntity) {
        this.entities.push(entity);
    }
}
