import * as React from 'react';
import {render} from 'react-dom';
import {AssetManager} from './common/assetManager';
import {Start} from './new/new';
import GameUI from './views/gameUI/gameUI';
AssetManager.addAsset('ship1', './assets/ships/ship1.png', {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.addAsset('ship2', './assets/ships/ship2.png', {width: 64, height: 48}, {x: 0, y: 0});
AssetManager.start();
Start.start();
/*

  if you kill a thing it doesnt die yet
  support for mouse click movement
  migrate to node

*/
/* 





render(<GameUI/>, document.getElementById('content'));

 */
