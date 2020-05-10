import {Sync, SyncStrategy} from './syncStrategy';
import {ClientEngine} from '../clientEngine';
import {assertType, Utils} from '@common/utils/utils';
import {Entity} from '@common/baseEntities/entity';
import {ClientEntity} from '../entities/clientEntity';
import {PhysicsEntity, PhysicsEntityModel} from '@common/baseEntities/physicsEntity';

const defaults = {
  syncsBufferLength: 5,
  maxReEnactSteps: 60, // maximum number of steps to re-enact
  RTTEstimate: 2, // estimate the RTT as two steps (for updateRate=6, that's 200ms)
  extrapolate: 2, // player performs method "X" which means extrapolate to match server time. that 100 + (0..100)
  localObjBending: 0.1, // amount of bending towards position of sync object
  remoteObjBending: 0.6, // amount of bending towards position of sync object
  bendingIncrements: 10, // the bending should be applied increments (how many steps for entire bend)
};

export type PlayerKeyInput = {
  input: string;
  messageIndex: number;
  movement: boolean;
  step: number;
};

export class ExtrapolateStrategy extends SyncStrategy {
  STEP_DRIFT_THRESHOLDS = {
    onServerSync: {MAX_LEAD: 2, MAX_LAG: 3}, // max step lead/lag allowed after every server sync
    onEveryStep: {MAX_LEAD: 7, MAX_LAG: 4}, // max step lead/lag allowed at every step
    clientReset: 40, // if we are behind this many steps, just reset the step counter
  };
  private recentInputs: {[stepNumber: number]: PlayerKeyInput[]};
  constructor(clientEngine: ClientEngine, public options: typeof defaults) {
    super(clientEngine, {...defaults, ...options});

    this.recentInputs = {};
    this.gameEngine.on('client__processInput', this.clientInputSave.bind(this));
  }

  // apply a new sync
  applySync(sync: Sync): 'SYNC_APPLIED' | null {
    // if sync is in the future, we are not ready to apply yet.
    if (sync.stepCount > this.gameEngine.stepCount) {
      return null;
    }
    const game = this.gameEngine;

    console.log('extrapolate applying sync');

    //
    //    scan all the objects in the sync
    //
    // 1. if the object has a local shadow, adopt the server object,
    //    and destroy the shadow
    //
    // 2. if the object exists locally, sync to the server object,
    //    later we will re-enact the missing steps and then bend to
    //    the current position
    //
    // 3. if the object is new, just create it
    //
    let serverStep = sync.stepCount;

    const entityMap = Utils.toDictionary(sync.entities, (a) => a.entityId);
    for (let i = this.gameEngine.entities.length - 1; i >= 0; i--) {
      const entity = this.gameEngine.entities.getIndex(i);
      assertType<Entity & ClientEntity>(entity);
      if (entity.clientDestroyedTick !== undefined) {
        entity.clientDestroyedTick--;
        if (entity.clientDestroyedTick <= 0) {
          entity.clientDestroyedTick = undefined;
        }
      }
      if (entityMap[entity.entityId]) {
        continue;
      }
      entity.destroy();
      this.gameEngine.entities.remove(entity);
    }

    for (const messageModel of sync.entities) {
      const foundEntityShadow = this.gameEngine.entities.array.find((a) => a.inputId === messageModel.inputId);
      if (foundEntityShadow) {
        // case 1: this object has a local shadow object on the client
        console.log(`object ${messageModel.entityId} replacing local shadow ${foundEntityShadow.entityId}`);

        if (!this.gameEngine.entities.lookup(messageModel.entityId)) {
          const newObj = this.addNewObject(messageModel);
          if (newObj instanceof PhysicsEntity) {
            newObj.saveState(foundEntityShadow.serialize() as PhysicsEntityModel);
          }
        }
        this.gameEngine.entities.remove(foundEntityShadow);
      } else {
        let foundEntity = this.gameEngine.entities.lookup(messageModel.entityId);
        if (!foundEntity) {
          foundEntity = this.addNewObject(messageModel);
        } else {
          if (foundEntity instanceof PhysicsEntity) {
            foundEntity.saveState();
          }
          foundEntity.reconcileFromServer(messageModel);
        }
      }
    }

    //
    // reenact the steps that we want to extrapolate forwards
    //
    console.debug(`extrapolate re-enacting steps from [${serverStep}] to [${game.stepCount}]`);
    if (serverStep < game.stepCount - this.options.maxReEnactSteps) {
      serverStep = game.stepCount - this.options.maxReEnactSteps;
      console.info(`too many steps to re-enact.  Starting from [${serverStep}] to [${game.stepCount}]`);
    }

    const clientStep = game.stepCount;
    for (game.stepCount = serverStep; game.stepCount < clientStep; ) {
      if (this.recentInputs[game.stepCount]) {
        for (const inputDesc of this.recentInputs[game.stepCount]) {
          if (!inputDesc.movement) continue;
          console.trace(`extrapolate re-enacting movement input[${inputDesc.messageIndex}]: ${inputDesc.input}`);
          this.gameEngine.processInput(inputDesc, this.gameEngine.clientPlayerId!);
        }
      }

      // run the game engine step in "reenact" mode
      this.gameEngine.step(true);
    }
    this.cleanRecentInputs(serverStep);

    //
    // bend back to original state
    //
    for (const entity of this.gameEngine.entities.array) {
      // shadow objects are not bent
      if (entity.shadowEntity) continue;
      if (entity instanceof PhysicsEntity) {
        const isLocal = entity.owningPlayerId === this.gameEngine.clientPlayerId; // eslint-disable-line eqeqeq
        const bending = isLocal ? this.options.localObjBending : this.options.remoteObjBending;
        entity.bendToCurrentState(bending, isLocal, this.options.bendingIncrements);
      }
    }

    return 'SYNC_APPLIED';
  }

  // clean up the input buffer
  cleanRecentInputs(lastServerStep: number) {
    for (const input of Utils.safeKeys(this.recentInputs)) {
      if (input <= lastServerStep) {
        delete this.recentInputs[input];
      }
    }
  }

  // keep a buffer of inputs so that we can replay them on extrapolation
  clientInputSave(inputEvent: PlayerKeyInput) {
    // if no inputs have been stored for this step, create an array
    if (!this.recentInputs[inputEvent.step]) {
      this.recentInputs[inputEvent.step] = [];
    }
    this.recentInputs[inputEvent.step].push(inputEvent);
  }
}
