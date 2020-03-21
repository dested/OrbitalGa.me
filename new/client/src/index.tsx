import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App width={window.innerWidth} height={window.innerHeight} />
  </React.StrictMode>,
  document.getElementById('root')
);
