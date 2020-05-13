import React, {useCallback} from 'react';
import './index.css';
import {observer} from 'mobx-react';
import {useStores} from '../../store/stores';
import {JoinButton, LoginBox, Logo, Wrapper} from './index.styles';
import {GoFullScreen} from '../../components/goFullScreen';
import {useLeaderboardQuery} from '../../schema/generated/graphql';
import {useApolloClient} from 'react-apollo-hooks';

const styles = {
  scoreItem: {
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.3rem',
    lineHeight: '0.8rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
  },
  score: {
    textAlign: 'center',
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.7rem',
    color: 'white',
    marginBottom: '1rem',
  },
} as const;

export const LeaderboardScreen: React.FC = observer((props) => {
  const apolloClient = useApolloClient();
  const {uiStore} = useStores();
  const {loading, data} = useLeaderboardQuery({
    client: apolloClient,
  });

  const onLogin = useCallback(() => {
    uiStore.setScreen('login');
  }, []);

  return (
    <Wrapper>
      <LoginBox>
        <Logo>Today's Leaderboard</Logo>
        <div
          style={{
            marginLeft: '1rem',
            marginRight: '1rem',
            marginBottom: '0.5rem',
            maxHeight: '50vh',
            overflowY: 'scroll',
          }}
        >
          {loading ? (
            <span style={styles.score}>Loading...</span>
          ) : (
            data?.leaderboard.map((l) => (
              <div key={l.sessionId} style={styles.scoreItem}>
                <span>
                  {l.anonymous && '*'}
                  {l.username}
                </span>
                <span>{l.score}</span>
              </div>
            ))
          )}
        </div>
        <JoinButton onClick={onLogin}>Back</JoinButton>
      </LoginBox>
      <GoFullScreen />
    </Wrapper>
  );
});
