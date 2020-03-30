import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {GameScreen} from './screens/gameScreen';

ReactDOM.render(
  <React.StrictMode>
    <GameScreen width={window.innerWidth} height={window.innerHeight} />
  </React.StrictMode>,
  document.getElementById('root')
);
