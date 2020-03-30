import React, {useEffect, useRef, useState} from 'react';
import './index.css';
import {ClientGameUI} from '../../game/clientGameUI';
import {ClientSocket} from '../../clientSocket';
import {create} from 'mobx-persist';
import {uiStore} from '../../store/uiStore';
import {Utils} from '../../../../common/src/utils/utils';
import {observer} from 'mobx-react-lite';

export const LoadingScreen: React.FC = observer(props => {
  useEffect(() => {
    async function load() {
      const hydrate = await create({
        jsonify: true,
      });
      await hydrate('uiStore', uiStore);
    }
    Promise.all([load(), Utils.timeout(1000)]).then(() => {
      uiStore.setScreen('login');
    });
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
        <span style={{fontSize: '3rem'}}>Loading...</span>
      </div>
    </div>
  );
});
