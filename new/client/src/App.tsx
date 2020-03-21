import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {ClientGameUI} from './game/clientGameUI';
import {ClientSocket} from './clientSocket';

const App: React.FC<{width: number; height: number}> = props => {
  const client = useRef<ClientGameUI>(null);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    connect();
  }, []);

  function connect() {
    client.current = new ClientGameUI(
      {
        onDisconnect: () => {
          setDisconnected(true);
        },
      },
      new ClientSocket()
    );
  }

  return (
    <div className="App">
      <canvas key={'canvas'} id={'game'} width={props.width} height={props.height} />
      {disconnected && (
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
          <span style={{fontSize: '3rem'}}>DISCONNECTED</span>
          <button
            onClick={() => {
              connect();
              setDisconnected(false);
            }}
          >
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
