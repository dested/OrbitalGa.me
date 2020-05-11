import React from 'react';
import {GameData} from '../game/gameData';

const styles = {
  wrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
    borderBottomLeftRadius: '20px',
    padding: '0.5rem',
    backgroundColor: 'rgb(38,62,85,0.85)',
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.3rem',
    color: 'white',
    listStyle: 'none',
  },
} as const;

export const Leaderboard = (props: {tick: number}) => {
  const client = GameData.client;
  const playerEntityId = client?.clientEngine.playerEntityId;

  return (client?.clientEngine.leaderboardScores.length ?? 0) > 0 ? (
    <ul style={styles.wrapper}>
      <li style={{fontWeight: 'bold', fontSize: '1.3em', marginBottom: '1em'}}>Leaderboard</li>
      {client?.clientEngine.leaderboardScores.map((score) => (
        <li
          key={score.userId}
          style={{
            fontWeight: score.userId === playerEntityId ? 'bold' : 'initial',
          }}
        >
          {score.rank}: {score.username} - {score.calculatedScore} {/*JSON.stringify(score, null, 2)*/}
        </li>
      ))}
    </ul>
  ) : (
    <></>
  );
};
