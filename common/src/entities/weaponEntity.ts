import {Entity} from '../baseEntities/entity';

export interface WeaponEntity {
  damage: number;
  explosionIntensity: number;
  isWeapon: true;
  ownerPlayerEntityId?: number;
  weaponSide: 'player' | 'enemy' | 'neutral';
  causedDamage(damage: number, otherEntity: Entity): void;
  causedKill(otherEntity: Entity): void;
  hurt(damage: number): void;
}

export function isWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & WeaponEntity {
  return 'isWeapon' in entity;
}

export function isEnemyWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & WeaponEntity {
  return isWeapon(entity) && entity.weaponSide === 'enemy';
}
export function isNeutralWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & WeaponEntity {
  return isWeapon(entity) && entity.weaponSide === 'neutral';
}
export function isPlayerWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & WeaponEntity {
  return isWeapon(entity) && entity.weaponSide === 'player';
}
