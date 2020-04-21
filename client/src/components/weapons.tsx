import React, {useCallback} from 'react';
import {GameData} from '../game/gameData';
import spaceMissiles_001 from '../assets/Missiles/spaceMissiles_001.png';
import spaceMissiles_004 from '../assets/Missiles/spaceMissiles_004.png';
import laserBlue02 from '../assets/Lasers/laserBlue02.png';
import laserBlue03 from '../assets/Lasers/laserBlue03.png';
import laserBlue03Spray from '../assets/Lasers/laserBlue03Spray.png';
import {PlayerWeapon, WeaponConfigs} from '@common/game/gameRules';
import {boxSize, SelectWeaponBox} from './weapons.styles';
import {Utils} from '@common/utils/utils';

const images: {[key in PlayerWeapon]: string} = {
  laser1Spray10: laserBlue03Spray,
  laser1: laserBlue03,
  laser2: laserBlue02,
  torpedo: spaceMissiles_004,
  rocket: spaceMissiles_001,
};

const styles = {
  wrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  f1: {flex: 1, display: 'flex'},
  image: {height: `calc(${boxSize} - 0.7rem)`, margin: '0.4rem'},
  ammo: {
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.5rem',
    marginLeft: 15,
    color: 'rgb(128,222,102)',
  },
  weaponBody: {
    display: 'flex',
    flexDirection: 'column',
  },
} as const;

export const Weapons = (props: {tick: number}) => {
  const client = GameData.client;
  const liveEntity = client?.liveEntity;

  const selectWeapon = useCallback((weapon: PlayerWeapon) => {
    return () => {
      const player = GameData.client?.liveEntity;
      if (!player) {
        return;
      }
      player.setKey('weapon', weapon);
    };
  }, []);

  if (!liveEntity) {
    return <></>;
  }
  return (
    <div style={styles.wrapper}>
      {liveEntity.availableWeapons.map((weapon) => (
        <div key={weapon.weapon} style={styles.weaponBody}>
          <span style={styles.ammo}>
            {Utils.switchType(WeaponConfigs[weapon.weapon].ammoType, {
              infinite: <>&nbsp;</>,
              'per-shot': <>{weapon.ammo}</>,
              time: <>{(weapon.ammo / 1000).toFixed()}</>,
            })}
          </span>
          <SelectWeaponBox
            onClick={selectWeapon(weapon.weapon)}
            key={weapon.weapon}
            liveEntity={liveEntity}
            weapon={weapon}
          >
            <img src={images[weapon.weapon]} style={styles.image} />
          </SelectWeaponBox>
        </div>
      ))}
    </div>
  );
};
