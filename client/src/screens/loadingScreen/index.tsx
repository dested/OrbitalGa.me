import React, {useEffect} from 'react';
import './index.css';
import {create} from 'mobx-persist';
import {uiStore} from '../../store/uiStore';
import {Utils} from '@common/utils/utils';
import {observer} from 'mobx-react-lite';
import {AssetManager} from '../../utils/assetManager';

import meteorBrownBig1 from '../../assets/meteors/meteorBrown_big1.png';
import meteorBrownBig2 from '../../assets/meteors/meteorBrown_big2.png';
import meteorBrownBig3 from '../../assets/meteors/meteorBrown_big3.png';
import meteorBrownBig4 from '../../assets/meteors/meteorBrown_big4.png';
import meteorBrownMed1 from '../../assets/meteors/meteorBrown_med1.png';
import meteorBrownMed2 from '../../assets/meteors/meteorBrown_med2.png';
import meteorBrownSmall1 from '../../assets/meteors/meteorBrown_small1.png';
import meteorBrownSmall2 from '../../assets/meteors/meteorBrown_small2.png';
import meteorBrownTiny1 from '../../assets/meteors/meteorBrown_tiny1.png';
import meteorBrownTiny2 from '../../assets/meteors/meteorBrown_tiny2.png';

import meteorGreyBig1 from '../../assets/meteors/meteorGrey_big1.png';
import meteorGreyBig2 from '../../assets/meteors/meteorGrey_big2.png';
import meteorGreyBig3 from '../../assets/meteors/meteorGrey_big3.png';
import meteorGreyBig4 from '../../assets/meteors/meteorGrey_big4.png';
import meteorGreyMed1 from '../../assets/meteors/meteorGrey_med1.png';
import meteorGreyMed2 from '../../assets/meteors/meteorGrey_med2.png';
import meteorGreySmall1 from '../../assets/meteors/meteorGrey_small1.png';
import meteorGreySmall2 from '../../assets/meteors/meteorGrey_small2.png';
import meteorGreyTiny1 from '../../assets/meteors/meteorGrey_tiny1.png';
import meteorGreyTiny2 from '../../assets/meteors/meteorGrey_tiny2.png';

import shield1 from '../../assets/shields/shield1.png';
import shield2 from '../../assets/shields/shield2.png';
import shield3 from '../../assets/shields/shield3.png';
import laserRed13 from '../../assets/lasers/laserRed13.png';
import laserBlue13 from '../../assets/lasers/laserBlue13.png';
import laserBlueExplosion from '../../assets/lasers/laserBlueExplosion.png';
import ship1 from '../../assets/ships/playerShip1_blue.png';
import ship2 from '../../assets/ships/playerShip2_red.png';
import stars from '../../assets/stars.png';
import {GameData} from '../../game/gameData';
import {GameConstants} from '@common/game/gameConstants';

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
      AssetManager.addAsset('meteor.brown.big.1', meteorBrownBig1, {width: 101, height: 84}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.big.2', meteorBrownBig2, {width: 120, height: 98}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.big.3', meteorBrownBig3, {width: 89, height: 82}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.big.4', meteorBrownBig4, {width: 98, height: 96}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.med.1', meteorBrownMed1, {width: 43, height: 43}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.med.2', meteorBrownMed2, {width: 45, height: 40}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.small.1', meteorBrownSmall1, {width: 28, height: 28}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.small.2', meteorBrownSmall2, {width: 29, height: 26}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.tiny.1', meteorBrownTiny1, {width: 18, height: 18}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.brown.tiny.2', meteorBrownTiny2, {width: 16, height: 15}, {x: 0, y: 0});

      AssetManager.addAsset('meteor.grey.big.1', meteorGreyBig1, {width: 101, height: 84}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.big.2', meteorGreyBig2, {width: 120, height: 98}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.big.3', meteorGreyBig3, {width: 89, height: 82}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.big.4', meteorGreyBig4, {width: 98, height: 96}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.med.1', meteorGreyMed1, {width: 43, height: 43}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.med.2', meteorGreyMed2, {width: 45, height: 40}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.small.1', meteorGreySmall1, {width: 28, height: 28}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.small.2', meteorGreySmall2, {width: 29, height: 26}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.tiny.1', meteorGreyTiny1, {width: 18, height: 18}, {x: 0, y: 0});
      AssetManager.addAsset('meteor.grey.tiny.2', meteorGreyTiny2, {width: 16, height: 15}, {x: 0, y: 0});

      AssetManager.addAsset('laser.red', laserRed13, {width: 9, height: 57}, {x: 0, y: 0});
      AssetManager.addAsset('laser.blue', laserBlue13, {width: 9, height: 57}, {x: 0, y: 0});
      AssetManager.addAsset('laser.blue.explosion', laserBlueExplosion, {width: 48, height: 46}, {x: 0, y: 0});
      AssetManager.addAsset('shield.1', shield1, {width: 133, height: 108}, {x: 0, y: 0});
      AssetManager.addAsset('shield.2', shield2, {width: 143, height: 119}, {x: 0, y: 0});
      AssetManager.addAsset('shield.3', shield3, {width: 144, height: 137}, {x: 0, y: 0});
      AssetManager.addAsset('ship1', ship1, {width: 99, height: 75}, {x: 0, y: 0});
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
