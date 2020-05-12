import {Game} from '../game/game';
import {EntityModels} from '../models/serverToClientMessages';
import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';
import {ClientActor} from './clientActor';

export abstract class Entity {
  actor?: ClientActor<this>;

  entityId: number;
  markToDestroy: boolean = false;
  owningPlayerId?: number;

  abstract type: EntityModels['type'];

  constructor(public game: Game, messageModel: EntityModel) {
    this.entityId = messageModel.entityId;
  }

  destroy() {
    this.markToDestroy = true;
  }

  abstract gameTick(duration: number): void;

  inView(view: {height: number; width: number; x: number; y: number}): boolean {
    return true;
  }

  postTick() {}

  reconcileFromServer(messageModel: EntityModel) {
    this.entityId = messageModel.entityId;
  }

  serialize(): EntityModel {
    return {
      entityId: this.entityId,
    };
  }
}

export type EntityModel = {
  entityId: number;
};

export const EntityModelSchema: SDSimpleObject<EntityModel> = {
  entityId: 'uint32',
};
