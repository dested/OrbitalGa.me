import {SDBitmask, SDEnum} from '../schemaDefiner/schemaDefinerTypes';
import {PlayerWeapon} from '../game/gameRules';
import {PlayerInputKeys} from '../entities/playerEntity';

export const PlayerWeaponEnumSchema: SDEnum<PlayerWeapon> = {
  flag: 'enum',
  rocket: 1,
  laser1: 2,
  laser2: 3,
  torpedo: 4,
};
export const PlayerInputKeyBitmask: SDBitmask<PlayerInputKeys> = {
  flag: 'bitmask',
  shoot: 0,
  right: 1,
  left: 2,
  up: 3,
  down: 4,
};
