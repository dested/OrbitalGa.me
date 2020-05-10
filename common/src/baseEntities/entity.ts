import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {EntityModels} from '../models/serverToClientMessages';
import {GameConstants} from '../game/gameConstants';
import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';
import {PhysicsEntityModel} from './physicsEntity';

type BoundingBox = {
  height: number;
  offsetX?: number;
  offsetY?: number;
  polygon?: Polygon;
  width: number;
};

export abstract class Entity {
  boundingBoxes: BoundingBox[] = [];
  entityId: number;
  inputId: number;
  markToDestroy: boolean = false;
  onlyVisibleToPlayerEntityId?: number;
  owningPlayerId?: number;

  shadowEntity: boolean = false;
  abstract type: EntityModels['type'];

  constructor(protected game: Game, messageModel: EntityModel) {
    this.entityId = messageModel.entityId;
    this.inputId = messageModel.inputId;
  }

  destroy() {
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        this.game.collisionEngine.remove(boundingBox.polygon);
        boundingBox.polygon = undefined;
      }
    }
    this.markToDestroy = true;
  }

  abstract gameTick(duration: number): void;

  isVisibleAtCoordinate(viewX: number, viewY: number, viewWidth: number, viewHeight: number) {
    return true;
  }

  postTick() {}

  reconcileFromServer(messageModel: EntityModel) {
    this.entityId = messageModel.entityId;
    this.inputId = messageModel.inputId;
  }

  serialize(): EntityModel {
    return {
      entityId: this.entityId,
      inputId: this.inputId,
    };
  }
}

export type EntityModel = {
  entityId: number;
  inputId: number;
};

export const EntityModelSchema: SDSimpleObject<EntityModel> = {
  inputId: 'uint32',
  entityId: 'uint32',
};
