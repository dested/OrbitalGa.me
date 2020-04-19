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
import {Weapons} from '../../components/weapons';
import {JoinButton, LoginBox, Logo, Wrapper} from '../loginScreen/index.styles';
import {ClientGame} from '../../game/clientGame';
import {Leaderboard} from '../../components/leaderboard';
import {STOCError} from '@common/models/serverToClientMessages';

const leftJoystickOptions = {
  mode: 'static',
  color: 'white',
  size: 70,
  position: {
    top: '50%',
    left: '50%',
  },
} as const;
const rightJoystickOptions = {
  mode: 'static',
  color: 'white',
  size: 70,
  position: {
    top: '50%',
    left: '50%',
  },
  lockX: true,
  lockY: true,
} as const;

const styles = {
  canvas: {width: '100vw', height: '100vh', position: 'absolute', zIndex: -99},
  label: {fontSize: '1rem', color: 'white'},
  leftJoyStick: {
    position: 'absolute',
    height: '30%',
    width: '30%',
    bottom: 0,
    left: 0,
    background: 'transparent',
  },
  rightJoystick: {
    position: 'absolute',
    height: '30%',
    width: '30%',
    bottom: 0,
    right: 0,
    background: 'transparent',
  },
} as const;

export const GameScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const [died, setDied] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    GameData.setOptions({
      onError: (client: ClientGame, error: STOCError) => {},
      onDied: () => {
        setDied(true);
      },
      onUIUpdate: () => {
        setTick(Math.random());
      },
      onReady: () => {},
      onOpen: (client) => {
        client.joinGame(uiStore.playerName!);
      },
      onDisconnect: () => {
        setDisconnected(true);
      },
    });
  }, []);

  const connect = useCallback(() => {
    GameData.joinGame(uiStore.serverPath!, uiStore.playerName!, {
      onError: (client: ClientGame, error: STOCError) => {},
      onDied: () => {
        setDied(true);
      },
      onUIUpdate: () => {
        setTick(Math.random());
      },
      onReady: () => {},
      onOpen: (client) => {
        client.joinGame(uiStore.playerName!);
      },
      onDisconnect: () => {
        setDisconnected(true);
      },
    });
  }, [uiStore.serverPath]);

  const revive = useCallback(() => {
    setDied(false);
    connect();
  }, []);

  const managerListenerMove = useCallback((manager: JoystickManager) => {
    const onMove = (evt: EventData, stick: JoystickOutputData) => {
      GameData.client?.liveEntity?.setKey('left', false);
      GameData.client?.liveEntity?.setKey('down', false);
      GameData.client?.liveEntity?.setKey('right', false);
      GameData.client?.liveEntity?.setKey('up', false);
      switch (stick.direction?.x) {
        case 'left':
          GameData.client?.liveEntity?.setKey('left', true);
          break;
        case 'right':
          GameData.client?.liveEntity?.setKey('right', true);
          break;
      }
      switch (stick.direction?.y) {
        case 'up':
          GameData.client?.liveEntity?.setKey('up', true);
          break;
        case 'down':
          GameData.client?.liveEntity?.setKey('down', true);
          break;
      }
    };

    const onEnd = () => {
      GameData.client?.liveEntity?.setKey('left', false);
      GameData.client?.liveEntity?.setKey('down', false);
      GameData.client?.liveEntity?.setKey('right', false);
      GameData.client?.liveEntity?.setKey('up', false);
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
      GameData.client?.liveEntity?.setKey('shoot', true);
    };

    const onEnd = () => {
      GameData.client?.liveEntity?.setKey('shoot', false);
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
        style={styles.canvas}
      />
      <Weapons tick={tick} />
      <Wrapper>
        {disconnected && (
          <LoginBox>
            <Logo>Orbital</Logo>
            <span style={styles.label}>DISCONNECTED</span>
            <JoinButton
              onClick={() => {
                connect();
                setDisconnected(false);
              }}
            >
              Reconnect
            </JoinButton>
          </LoginBox>
        )}
        {died && (
          <LoginBox>
            <Logo>Orbital</Logo>
            <span style={styles.label}>You Died</span>
            <JoinButton onClick={revive}>Revive</JoinButton>
          </LoginBox>
        )}
      </Wrapper>
      <GoFullScreen />
      <Leaderboard tick={tick} />
      {Utils.isMobile() && (
        <>
          <JoyStick
            options={leftJoystickOptions}
            containerStyle={styles.leftJoyStick}
            managerListener={managerListenerMove}
          />
          <JoyStick
            options={rightJoystickOptions}
            containerStyle={styles.rightJoystick}
            managerListener={managerListenerShoot}
          />
        </>
      )}
    </div>
  );
});
