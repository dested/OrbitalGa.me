import React from 'react';
import {GameData} from '../game/gameData';
import spaceMissiles_001 from '../assets/Missiles/spaceMissiles_001.png';
import spaceMissiles_004 from '../assets/Missiles/spaceMissiles_004.png';
import laserBlue02 from '../assets/Lasers/laserBlue02.png';
import {PlayerWeapon} from '@common/game/gameRules';

const images: {[key in PlayerWeapon]: string} = {
  laser: laserBlue02,
  torpedo: spaceMissiles_004,
  rocket: spaceMissiles_001,
};

const boxSize = '10vh';
const margin = 20;
const styles = {
  wrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    padding: 30,
    display: 'flex',
    justifyContent: 'space-between',
  },
  f1: {flex: 1, display: 'flex'},
  image: {height: `calc(${boxSize} - 10px * 2px)`, margin: 10},
  ammo: {fontFamily: 'kenney_spaceregular', fontSize: '1.3rem', marginBottom: 10, color: 'rgb(45,59,112)'},
} as const;

export const Weapons = (props: {tick: number}) => {
  const client = GameData.instance.client;
  const liveEntity = client?.liveEntity;
  if (!liveEntity) {
    return <></>;
  }

  const selectWeapon = (weapon: PlayerWeapon) => {
    const player = GameData.instance.client?.liveEntity;
    if (!player) {
      return;
    }
    player.setKey('weapon', weapon);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.f1} />
      {liveEntity.availableWeapons.map((weapon) => (
        <div
          onClick={() => selectWeapon(weapon.weapon)}
          key={weapon.weapon}
          style={{
            width: boxSize,
            height: `calc(${boxSize}*1.5px)`,
            backgroundColor: liveEntity.selectedWeapon === weapon.weapon ? '#beae8d' : 'white',
            margin,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
          }}
        >
          <div style={styles.f1} />
          <img src={images[weapon.weapon]} style={styles.image} />
          <div style={styles.f1} />
          <span style={styles.ammo}>{weapon.ammo}</span>
        </div>
      ))}
      <div style={styles.f1} />
    </div>
  );
};
