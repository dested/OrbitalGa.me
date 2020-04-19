import React from 'react';
import {GameData} from '../game/gameData';

const styles = {
  wrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
} as const;

export const Leaderboard = (props: {tick: number}) => {
  const client = GameData.client;
  const liveEntity = client?.liveEntity;

  return (
    <ul style={styles.wrapper}>
      {client?.leaderboardScores.map((score) => (
        <li
          key={score.userId}
          style={{
            fontFamily: 'kenney_spaceregular',
            fontSize: '0.6rem',
            color: 'white',
            fontWeight: score.userId === liveEntity?.entityId ? 'bold' : 'initial',
          }}
        >
          {score.rank}: {score.username} - {score.calculatedScore} {/*JSON.stringify(score, null, 2)*/}
        </li>
      ))}
    </ul>
  );
};
