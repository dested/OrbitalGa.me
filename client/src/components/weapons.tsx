import React, {useCallback} from 'react';
import {GameData} from '../game/gameData';
import spaceMissiles_001 from '../assets/Missiles/spaceMissiles_001.png';
import spaceMissiles_004 from '../assets/Missiles/spaceMissiles_004.png';
import laserBlue02 from '../assets/Lasers/laserBlue02.png';
import laserBlue03 from '../assets/Lasers/laserBlue03.png';
import {PlayerWeapon, WeaponConfigs} from '@common/game/gameRules';
import {boxSize, SelectWeaponBox} from './weapons.styles';
import {Utils} from '@common/utils/utils';

const images: {[key in PlayerWeapon]: string} = {
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
    justifyContent: 'space-between',
  },
  f1: {flex: 1, display: 'flex'},
  image: {height: `calc(${boxSize} - 2rem)`, margin: '0.5rem'},
  ammo: {
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.6rem',
    margin: 10,
    color: 'rgb(45,59,112)',
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
      <div style={styles.f1} />
      {liveEntity.availableWeapons.map((weapon) => (
        <SelectWeaponBox
          onClick={selectWeapon(weapon.weapon)}
          key={weapon.weapon}
          liveEntity={liveEntity}
          weapon={weapon}
        >
          <div style={styles.f1} />
          <img src={images[weapon.weapon]} style={styles.image} />
          <div style={styles.f1} />
          <span style={styles.ammo}>
            {Utils.switchType(WeaponConfigs[weapon.weapon].ammoType, {
              infinite: <>&nbsp;</>,
              'per-shot': <>{weapon.ammo}</>,
              time: <>{(weapon.ammo / 1000).toFixed()}</>,
            })}
          </span>
        </SelectWeaponBox>
      ))}
      <div style={styles.f1} />
    </div>
  );
};
