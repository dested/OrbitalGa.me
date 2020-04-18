import React, {useEffect} from 'react';
import {GameScreen} from './screens/gameScreen';
import {unreachable} from '@common/utils/unreachable';
import {useStores} from './store/stores';
import {StarBackground} from './components/starBackground';
import {LoadingScreen} from './screens/loadingScreen';
import {LoginScreen} from './screens/loginScreen';
import {observer} from 'mobx-react';

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
      default:
        throw unreachable(uiStore.screen);
    }
  }

  return (
    <>
      <StarBackground />
      {screen()}
    </>
  );
});
