import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import ship1 from './assets/ships/ship1.png';
import ship2 from './assets/ships/ship2.png';
import {AssetManager} from '../../common/src/utils/assetManager';

AssetManager.addAsset('ship1', ship1, {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.addAsset('ship2', ship2, {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.start();

ReactDOM.render(
  <React.StrictMode>
    <App width={window.innerWidth} height={window.innerHeight} />
  </React.StrictMode>,
  document.getElementById('root')
);
