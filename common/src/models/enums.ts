import {ABBitmask, ABEnum} from '../parsers/arrayBufferSchema';
import {PlayerWeapon} from '../game/gameRules';
import {PlayerInputKeys} from '../entities/playerEntity';

export const PlayerWeaponEnumSchema: ABEnum<PlayerWeapon> = {
  enum: true,
  rocket: 1,
  laser1: 2,
  laser2: 3,
  torpedo: 4,
};
export const PlayerInputKeyBitmask: ABBitmask<PlayerInputKeys> = {
  bitmask: true,
  shoot: 0,
  right: 1,
  left: 2,
  up: 3,
  down: 4,
};
