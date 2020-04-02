import {DocumentManager} from '../dataManager';
import {MongoDocument} from './mongoDocument';

export class DBPlayer extends MongoDocument {
  static collectionName = 'player';
  static db = new DocumentManager<DBPlayer>(DBPlayer.collectionName);

  name: string;
}
