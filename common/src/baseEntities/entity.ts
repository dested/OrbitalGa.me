import {Game} from '../game/game';
import {EntityModels} from '../models/serverToClientMessages';
import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';
import {ClientActor} from './clientActor';

export abstract class Entity {
  actor?: ClientActor<this>;

  entityId: number;
  inputId: number;
  markToDestroy: boolean = false;
  owningPlayerId?: number;

  shadowEntity: boolean = false;
  abstract type: EntityModels['type'];
  constructor(public game: Game, messageModel: EntityModel) {
    this.entityId = messageModel.entityId;
    this.inputId = messageModel.inputId;
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
