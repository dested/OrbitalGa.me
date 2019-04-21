import * as React from 'react';
import {render} from 'react-dom';
import {AssetManager} from './common/assetManager';
import {Start} from './new/new';
import GameUI from './views/gameUI/gameUI';
Start.start();
/*

every 100ms

*/
/* 


AssetManager.addAsset("ship1", "./assets/ships/ship1.png", {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.addAsset("ship2", "./assets/ships/ship2.png", {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.start();


render(<GameUI/>, document.getElementById('content'));

 */
