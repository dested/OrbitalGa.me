import React, {useEffect, useRef, useState} from 'react';
import './index.css';
import {ClientGameUI} from '../../game/clientGameUI';
import {ClientSocket} from '../../clientSocket';
import {create} from 'mobx-persist';
import {uiStore} from '../../store/uiStore';
import {Utils} from '../../../../common/src/utils/utils';
import {observer} from 'mobx-react-lite';
import {AssetManager} from '../../utils/assetManager';

import ship1 from '../../assets/ships/ship1.png';
import ship2 from '../../assets/ships/ship2.png';

export const LoadingScreen: React.FC = observer(props => {
  useEffect(() => {
    async function load() {
      const hydrate = await create({
        jsonify: true,
      });
      await hydrate('uiStore', uiStore);
    }

    async function assets() {
      AssetManager.addAsset('ship1', ship1, {width: 64, height: 48}, {x: 0, y: 0});
      AssetManager.addAsset('ship2', ship2, {width: 64, height: 48}, {x: 0, y: 0});
      await AssetManager.start();
    }

    Promise.all([load(), assets(), Utils.timeout(0)]).then(() => {
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
