import React, {useEffect, useRef, useState} from 'react';
import {GameData} from '../game/gameData';
import spaceMissiles_001 from '../assets/Missiles/spaceMissiles_001.png';
import spaceMissiles_004 from '../assets/Missiles/spaceMissiles_004.png';
import laserBlue02 from '../assets/Lasers/laserBlue02.png';
import {GameConstants} from '@common/game/gameConstants';
import {AllPlayerWeapons, PlayerWeapon} from '@common/game/gameRules';

const images: {[key in PlayerWeapon]: string} = {
  laser: laserBlue02,
  torpedo: spaceMissiles_004,
  rocket: spaceMissiles_001,
};

export const Weapons = (props: {tick: number}) => {
  const client = GameData.instance.client;
  const liveEntity = client?.liveEntity;
  if (!liveEntity) {
    return <></>;
  }
  const boxSize = GameConstants.screenSize.height * 0.1;
  const margin = 20;
  return (
    <div
      style={{
        width: '100%',
        position: 'absolute',
        bottom: 0,
        padding: 30,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <div style={{flex: 1}} />
      {liveEntity.availableWeapons.map((weapon) => (
        <div
          key={weapon.weapon}
          style={{
            width: boxSize,
            height: boxSize,
            backgroundColor: liveEntity.selectedWeapon === weapon.weapon ? 'red' : 'white',
            margin,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            border: 'solid 3px ' + (weapon.ammo > 0 ? 'green' : 'grey'),
          }}
        >
          <img src={images[weapon.weapon]} style={{height: boxSize - 10 * 2, margin: 10}} />
        </div>
      ))}
      <div style={{flex: 1}} />
    </div>
  );
};
