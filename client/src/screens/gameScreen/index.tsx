import React, {useCallback, useEffect, useState} from 'react';
import './index.css';
import {observer} from 'mobx-react';
import {GameConstants} from '@common/game/gameConstants';
import {useStores} from '../../store/stores';
import {Utils} from '@common/utils/utils';
import {JoyStick} from '../../components/joystick';
import {GoFullScreen} from '../../components/goFullScreen';
import {EventData, JoystickManager, JoystickOutputData} from 'nipplejs';
import {GameData} from '../../game/gameData';

export const GameScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const [died, setDied] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    connect();
  }, []);

  function connect() {
    GameData.instance.joinGame(uiStore.serverPath!, {
      onDied: () => {
        setDied(true);
      },
      onOpen: (client) => {
        client.joinGame();
      },
      onDisconnect: () => {
        setDisconnected(true);
      },
    });
  }
  const revive = () => {
    setDied(false);
    connect();
  };

  const managerListenerMove = useCallback((manager: JoystickManager) => {
    const onMove = (evt: EventData, stick: JoystickOutputData) => {
      GameData.instance.client?.liveEntity?.setKey('left', false);
      GameData.instance.client?.liveEntity?.setKey('down', false);
      GameData.instance.client?.liveEntity?.setKey('right', false);
      GameData.instance.client?.liveEntity?.setKey('up', false);
      switch (stick.direction?.x) {
        case 'left':
          GameData.instance.client?.liveEntity?.setKey('left', true);
          break;
        case 'right':
          GameData.instance.client?.liveEntity?.setKey('right', true);
          break;
      }
      switch (stick.direction?.y) {
        case 'up':
          GameData.instance.client?.liveEntity?.setKey('up', true);
          break;
        case 'down':
          GameData.instance.client?.liveEntity?.setKey('down', true);
          break;
      }
    };

    const onEnd = () => {
      GameData.instance.client?.liveEntity?.setKey('left', false);
      GameData.instance.client?.liveEntity?.setKey('down', false);
      GameData.instance.client?.liveEntity?.setKey('right', false);
      GameData.instance.client?.liveEntity?.setKey('up', false);
    };

    manager.on('move', onMove);
    manager.on('end', onEnd);
    return () => {
      manager.off('move', onMove);
      manager.off('end', onEnd);
    };
  }, []);

  const managerListenerShoot = useCallback((manager: any) => {
    const onMove = (e: any, stick: any) => {
      GameData.instance.client?.liveEntity?.setKey('shoot', true);
    };

    const onEnd = () => {
      GameData.instance.client?.liveEntity?.setKey('shoot', false);
    };

    manager.on('move', onMove);
    manager.on('end', onEnd);
    return () => {
      manager.off('move', onMove);
      manager.off('end', onEnd);
    };
  }, []);

  return (
    <div className="App">
      <canvas
        id={'game'}
        width={GameConstants.screenSize.width}
        height={GameConstants.screenSize.height}
        style={{width: '100vw', height: '100vh', position: 'absolute', zIndex: -99}}
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
      {died && (
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
          <span style={{fontSize: '3rem'}}>You died</span>
          <button style={{fontSize: '3rem'}} onClick={revive}>
            Revive
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
              size: 70,
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
