import React, {useCallback} from 'react';
import {GameData} from '../game/gameData';
import spaceMissiles_001 from '../assets/Missiles/spaceMissiles_001.png';
import spaceMissiles_004 from '../assets/Missiles/spaceMissiles_004.png';
import laserBlue02 from '../assets/Lasers/laserBlue02.png';
import {PlayerWeapon} from '@common/game/gameRules';
import {boxMargin, boxSize, SelectWeaponBox} from './weapons.styles';

const styles = {
  wrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
} as const;

export const Leaderboard = (props: {tick: number}) => {
  const client = GameData.instance.client;
  const liveEntity = client?.liveEntity;

  return (
    <ul style={styles.wrapper}>
      {client?.leaderboardScores.map((score) => (
        <li
          key={score.userId}
          style={{color: 'white', fontWeight: score.userId === liveEntity?.entityId ? 'bold' : 'initial'}}
        >
          {score.rank}: {score.username} - {score.calculatedScore} {/*JSON.stringify(score, null, 2)*/}
        </li>
      ))}
    </ul>
  );
};
