import React, {useCallback, useEffect, useRef, useState} from 'react';
import './index.css';
import {ClientGameUI} from '../../game/clientGameUI';
import {ClientSocket} from '../../clientSocket';
import {observer} from 'mobx-react';
import {useStores} from '../../store/stores';

export const LoginScreen: React.FC = observer(props => {
  const {uiStore} = useStores();
  useEffect(() => {}, []);

  const onJoin = useCallback(() => {
    uiStore.setScreen('game');
  }, []);

  return (
    <div className="App">
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          top: 0,
          color: 'white',
        }}
      >
        <button style={{fontSize: '3rem'}} onClick={onJoin}>
          Join
        </button>
      </div>
    </div>
  );
});
