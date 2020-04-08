import React, {useEffect} from 'react';
import './index.css';
import {create} from 'mobx-persist';
import {uiStore} from '../../store/uiStore';
import {Utils} from '@common/utils/utils';
import {observer} from 'mobx-react-lite';
import {GameData} from '../../game/gameData';
import {GameConstants} from '@common/game/gameConstants';
import {Assets} from '../../assets';
import {OrbitalAssets} from '../../utils/assetManager';

export const LoadingScreen: React.FC = observer((props) => {
  useEffect(() => {
    async function load() {
      const hydrate = await create({
        jsonify: true,
      });
      await hydrate('uiStore', uiStore);
      GameData.instance.spectateGame('1' /*todo current specate server*/);
    }

    async function assets() {
      for (const asset of Utils.safeKeys(Assets)) {
        OrbitalAssets.addAsset(asset, await Assets[asset].asset, {
          width: Assets[asset].width,
          height: Assets[asset].height,
        });
      }

      await OrbitalAssets.start();
    }

    Promise.all([load(), assets(), Utils.timeout(0)]).then(() => {
      uiStore.setScreen('login');
    });
  }, []);

  return (
    <div className="App">
      <canvas
        id={'game'}
        width={GameConstants.screenSize.width}
        height={GameConstants.screenSize.height}
        style={{width: '100vw', height: '100vh', position: 'absolute', zIndex: -99}}
      />
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
