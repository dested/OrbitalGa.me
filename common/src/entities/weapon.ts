import {Entity} from './entity';

export interface Weapon {
  damage: number;
  explosionIntensity: number;
  isWeapon: true;
  weaponSide: 'player' | 'enemy';
  hurt(damage: number, otherEntity: Entity, overlapX: number, overlap: number): void;
}

export function isEnemyWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & Weapon {
  return 'isWeapon' in entity && ((entity as unknown) as Weapon).weaponSide === 'enemy';
}

export function isPlayerWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & Weapon {
  return 'isWeapon' in entity && ((entity as unknown) as Weapon).weaponSide === 'player';
}