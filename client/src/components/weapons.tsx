import React, {useEffect, useRef, useState} from 'react';
import {AllPlayerWeapons} from '@common/entities/playerEntity';
import {CanvasUtils} from '../utils/canvasUtils';
import {OrbitalAssets} from '../utils/assetManager';
import {GameData} from '../game/gameData';
import spaceMissiles_001 from '../assets/Missiles/spaceMissiles_001.png';

export const Weapons = (props: {tick: number}) => {
  const client = GameData.instance.client;
  const liveEntity = client?.liveEntity;
  if (!liveEntity) {
    return <></>;
  }
  const boxSize = 70;
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
      {AllPlayerWeapons.map((weapon) => (
        <div
          style={{
            backgroundColor: liveEntity.selectedWeapon === weapon ? 'red' : 'white',
            margin,
            borderRadius: 10,
            border:
              'solid 3px ' +
              (liveEntity.availableWeapons.find((a) => a.weapon === weapon && a.ammo > 0) ? 'green' : 'grey'),
          }}
        >
          <img src={spaceMissiles_001} style={{width: boxSize, height: boxSize, margin: 10}} />
        </div>
      ))}
      <div style={{flex: 1}} />
    </div>
  );
};
