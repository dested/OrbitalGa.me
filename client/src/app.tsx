import React, {useEffect} from 'react';
import {GameScreen} from './screens/gameScreen';
import {unreachable} from '@common/utils/unreachable';
import {useStores} from './store/stores';
import {StarBackground} from './components/starBackground';
import {LoadingScreen} from './screens/loadingScreen';
import {LoginScreen} from './screens/loginScreen';
import {observer} from 'mobx-react';
import {GameConstants} from '@common/game/gameConstants';
import {LeaderboardScreen} from './screens/leaderboardScreen';

const styles = {
  canvas: {width: '100vw', height: '100vh', position: 'absolute', zIndex: -99},
} as const;

export const App = observer(() => {
  const {uiStore} = useStores();
  useEffect(() => {}, []);

  function screen() {
    switch (uiStore.screen) {
      case 'loading':
        return <LoadingScreen />;
      case 'login':
        return <LoginScreen />;
      case 'game':
        return <GameScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      default:
        throw unreachable(uiStore.screen);
    }
  }

  return (
    <>
      <StarBackground />
      <canvas
        id={'game'}
        width={GameConstants.screenSize.width}
        height={GameConstants.screenSize.height}
        style={styles.canvas}
      />
      {screen()}
    </>
  );
});
