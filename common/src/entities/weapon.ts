import {Entity} from './entity';

export interface Weapon {
  damage: number;
  explosionIntensity: number;
  isWeapon: true;
  side: 'player' | 'enemy';
}

export function isEnemyWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & Weapon {
  return 'isWeapon' in entity && ((entity as unknown) as Weapon).side === 'enemy';
}

export function isPlayerWeapon<TEntity extends Entity>(entity: TEntity): entity is TEntity & Weapon {
  return 'isWeapon' in entity && ((entity as unknown) as Weapon).side === 'player';
}
