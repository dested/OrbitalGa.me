import React, {useEffect} from 'react';
import './index.css';
import {create} from 'mobx-persist';
import {uiStore} from '../../store/uiStore';
import {Utils} from '@common/utils/utils';
import {observer} from 'mobx-react-lite';
import {AssetManager} from '../../utils/assetManager';

import laserRed13 from '../../assets/lasers/laserRed13.png';
import laserBlue13 from '../../assets/lasers/laserBlue13.png';
import ship1 from '../../assets/ships/playerShip1_blue.png';
import ship2 from '../../assets/ships/playerShip2_red.png';
import stars from '../../assets/stars.png';

export const LoadingScreen: React.FC = observer((props) => {
  useEffect(() => {
    async function load() {
      const hydrate = await create({
        jsonify: true,
      });
      await hydrate('uiStore', uiStore);
    }

    async function assets() {
      AssetManager.addAsset('laser.red', laserRed13, {width: 9, height: 57}, {x: 0, y: 0});
      AssetManager.addAsset('laser.blue', laserBlue13, {width: 9, height: 57}, {x: 0, y: 0});
      AssetManager.addAsset('ship1', ship1, {width: 112, height: 75}, {x: 0, y: 0});
      AssetManager.addAsset('ship2', ship2, {width: 112, height: 75}, {x: 0, y: 0});
      AssetManager.addAsset('stars', stars, {width: 256, height: 256}, {x: 0, y: 0});
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
