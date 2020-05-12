import {ClientEngine} from '../clientEngine';
import {Game} from '@common/game/game';
import {Entity} from '@common/baseEntities/entity';
import {EntityModels, STOCWorldState} from '@common/models/serverToClientMessages';
import {PhysicsEntity} from '@common/baseEntities/physicsEntity';

export type Sync = STOCWorldState;

export abstract class SyncStrategy {
  lastSync?: Sync;
  syncs: Sync[] = [];
  protected gameEngine: Game;
  protected abstract STEP_DRIFT_THRESHOLDS: {
    clientReset: number;
    onEveryStep: {MAX_LAG: number; MAX_LEAD: number};
    onServerSync: {MAX_LAG: number; MAX_LEAD: number};
  };

  constructor(protected clientEngine: ClientEngine) {
    this.clientEngine = clientEngine;
    this.gameEngine = clientEngine.game;
  }

  // add an object to our world
  addNewObject(messageModel: EntityModels): Entity {
    const curObj = this.gameEngine.instantiateEntity(messageModel);
    this.gameEngine.addObjectToWorld(curObj, true);
    return curObj;
  }

  abstract applySync(sync: Sync): 'SYNC_APPLIED' | null;

  // collect a sync and its events
  // maintain a "lastSync" member which describes the last sync we received from
  // the server.  the lastSync object contains:
  //  - syncObjects: all events in the sync indexed by the id of the object involved
  //  - syncSteps: all events in the sync indexed by the step on which they occurred
  //  - objCount
  //  - eventCount
  //  - stepCount
  collectSync(e: Sync) {
    // TODO: there is a problem below in the case where the client is 10 steps behind the server,
    // and the syncs that arrive are always in the future and never get processed.  To address this
    // we may need to store more than one sync.

    // ignore syncs which are older than the latest
    if (this.lastSync && this.lastSync.stepCount && this.lastSync.stepCount > e.stepCount) return;

    // before we overwrite the last sync, check if it was a required sync
    // syncs that create or delete objects are saved because they must be applied.
    if (this.lastSync) {
      this.syncs.push(this.lastSync);
    }
    this.lastSync = e;
  }

  // sync to step, by applying bending, and applying the latest sync
  syncStep(stepDesc: {dt?: number}) {
    // apply incremental bending
    for (const entity of this.gameEngine.entities.array) {
      if (entity instanceof PhysicsEntity) {
        entity.applyIncrementalBending(stepDesc);
      }
    }

    // apply all pending required syncs
    while (this.syncs.length) {
      const requiredStep = this.syncs[0].stepCount;

      // if we haven't reached the corresponding step, it's too soon to apply syncs
      if (requiredStep > this.gameEngine.stepCount) return;

      console.log(`applying a required sync ${requiredStep}`);
      this.applySync(this.syncs.shift()!);
    }

    // apply the sync and delete it on success
    if (this.lastSync) {
      const rc = this.applySync(this.lastSync);
      if (rc === 'SYNC_APPLIED') this.lastSync = undefined;
    }
  }
}
