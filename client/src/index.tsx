import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {GameScreen} from './screens/gameScreen';
import {stores, useStores} from './store/stores';
import {observer, Provider} from 'mobx-react';
import {unreachable} from '@common/utils/unreachable';
import {LoadingScreen} from './screens/loadingScreen';
import {LoginScreen} from './screens/loginScreen';
import {StarBackground} from './components/starBackground';

const App = observer(() => {
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

ReactDOM.render(
  <React.StrictMode>
    <Provider {...stores}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

/*
const arrayHash = new ArrayHash<Entity>('entityId');
const cluster = new EntityClusterer(arrayHash, 3);
for (let i = 0; i < 50; i++) {
  const x = cluster.getNewPlayerXPosition();
  arrayHash.push({x, y: 100, type: 'player', entityId: i} as Entity);
}
/!*
for (let i = 0; i < 50; i++) {
  const x = cluster.getNewEnemyXPosition();
  arrayHash.push({x, y: 100, type: 'swoopingEnemy', entityId: i} as Entity);
}
*!/
const g=cluster.getGroupings('player')
cluster.getNewPlayerXPosition();
*/
