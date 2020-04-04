import React, {useCallback, useEffect, useRef, useState} from 'react';
import './index.css';
import {ClientGameUI} from '../../game/clientGameUI';
import {ClientSocket} from '../../clientSocket';
import {observer} from 'mobx-react';
import {GameConstants} from '@common/game/gameConstants';
import {useStores} from '../../store/stores';
import {Utils} from '@common/utils/utils';
import {JoyStick} from '../../components/joystick';
import {GoFullScreen} from '../../components/goFullScreen';
import {EventData, JoystickManager, JoystickOutputData} from 'nipplejs';

export const GameScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const client = useRef<ClientGameUI>(null);
  const [died, setDied] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    connect();
  }, []);

  function connect() {
    (client as React.MutableRefObject<ClientGameUI>).current = new ClientGameUI(
      uiStore.serverPath!,
      {
        onDied: () => {
          setDied(true);
        },
        onDisconnect: () => {
          setDisconnected(true);
        },
      },
      new ClientSocket()
    );
  }

  const managerListenerMove = useCallback(
    (manager: JoystickManager) => {
      const onMove = (evt: EventData, stick: JoystickOutputData) => {
        client.current?.liveEntity?.releaseKey('left');
        client.current?.liveEntity?.releaseKey('down');
        client.current?.liveEntity?.releaseKey('right');
        client.current?.liveEntity?.releaseKey('up');
        switch (stick.direction?.x) {
          case 'left':
            client.current?.liveEntity?.pressKey('left');
            break;
          case 'right':
            client.current?.liveEntity?.pressKey('right');
            break;
        }
        switch (stick.direction?.y) {
          case 'up':
            client.current?.liveEntity?.pressKey('up');
            break;
          case 'down':
            client.current?.liveEntity?.pressKey('down');
            break;
        }
      };

      const onEnd = () => {
        client.current?.liveEntity?.releaseKey('left');
        client.current?.liveEntity?.releaseKey('down');
        client.current?.liveEntity?.releaseKey('right');
        client.current?.liveEntity?.releaseKey('up');
      };

      manager.on('move', onMove);
      manager.on('end', onEnd);
      return () => {
        manager.off('move', onMove);
        manager.off('end', onEnd);
      };
    },
    [client.current]
  );
  const managerListenerShoot = useCallback(
    (manager: any) => {
      const onMove = (e: any, stick: any) => {
        client.current?.liveEntity?.pressKey('shoot');
      };

      const onEnd = () => {
        client.current?.liveEntity?.releaseKey('shoot');
      };

      manager.on('move', onMove);
      manager.on('end', onEnd);
      return () => {
        manager.off('move', onMove);
        manager.off('end', onEnd);
      };
    },
    [client.current]
  );

  return (
    <div className="App">
      <canvas
        id={'game'}
        width={GameConstants.screenSize.width}
        height={GameConstants.screenSize.height}
        style={{width: '100vw', height: '100vh'}}
      />
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
      <GoFullScreen />
      {Utils.isMobile() && (
        <>
          <JoyStick
            options={{
              mode: 'static',
              color: 'white',
              size: 70,
              position: {
                top: '50%',
                left: '50%',
              },
            }}
            containerStyle={{
              position: 'absolute',
              height: '30%',
              width: '30%',
              bottom: 0,
              left: 0,
              background: 'transparent',
            }}
            managerListener={managerListenerMove}
          />
          <JoyStick
            options={{
              mode: 'static',
              color: 'white',
              position: {
                top: '50%',
                left: '50%',
              },
              lockX: true,
              lockY: true,
            }}
            containerStyle={{
              position: 'absolute',
              height: '30%',
              width: '30%',
              bottom: 0,
              right: 0,
              background: 'transparent',
            }}
            managerListener={managerListenerShoot}
          />
        </>
      )}
    </div>
  );
});
