import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {AssetManager} from './utils/assetManager';

AssetManager.addAsset('ship1', './assets/ships/ship1.png', {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.addAsset('ship2', './assets/ships/ship2.png', {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.start();

ReactDOM.render(
  <React.StrictMode>
    <App width={window.innerWidth} height={window.innerHeight} />
  </React.StrictMode>,
  document.getElementById('root')
);
