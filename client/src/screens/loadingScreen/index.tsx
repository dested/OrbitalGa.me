import React, {useEffect} from 'react';
import './index.css';
import {create} from 'mobx-persist';
import {Utils} from '@common/utils/utils';
import {observer} from 'mobx-react-lite';
import {GameData} from '../../game/gameData';
import {GameConstants} from '@common/game/gameConstants';
import {Assets} from '../../assets';
import {OrbitalAssets} from '../../utils/assetManager';
import {SpectateDocument, SpectateQuery} from '../../schema/generated/graphql';
import {apolloClient} from '../../schema/apolloClient';
import {useStores} from '../../store/stores';

export const LoadingScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  useEffect(() => {
    async function load() {
      const hydrate = await create({
        jsonify: true,
      });
      await hydrate('uiStore', uiStore);
      try {
        const result = await apolloClient.query<SpectateQuery>({
          query: SpectateDocument,
        });
        if (result.data.spectateServer) {
          GameData.start();
          GameData.spectateGame(result.data.spectateServer.serverUrl);
        } else {
          uiStore.setServerDown(true);
          GameData.start();
        }
      } catch (ex) {
        uiStore.setServerDown(true);
        GameData.start();
      }
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
        <span style={{fontSize: '2rem'}}>Loading...</span>
      </div>
    </div>
  );
});
