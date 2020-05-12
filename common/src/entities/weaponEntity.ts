import {Entity} from '../baseEntities/entity';

export interface WeaponEntity {
  damage: number;
  explosionIntensity: number;
  isWeapon: true;
  ownerPlayerEntityId: number;
  weaponSide: 'player' | 'enemy';
  causedDamage(damage: number, otherEntity: Entity): void;
  causedKill(otherEntity: Entity): void;
  hurt(damage: number, otherEntity: Entity, overlapX: number, overlap: number): void;
}

export function isEnemyWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & WeaponEntity {
  return 'isWeapon' in entity && ((entity as unknown) as WeaponEntity).weaponSide === 'enemy';
}

export function isPlayerWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & WeaponEntity {
  return 'isWeapon' in entity && ((entity as unknown) as WeaponEntity).weaponSide === 'player';
}
