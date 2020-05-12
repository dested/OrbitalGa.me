import {ShadowableEntity} from '../baseEntities/shadowableEntity';
import {Entity} from '../baseEntities/entity';

export class EntityUtils {
  static isShadowEntity(entity: Entity): entity is Entity & ShadowableEntity {
    return 'shadowEntity' in entity && (entity as Entity & ShadowableEntity).shadowEntity;
  }
}
