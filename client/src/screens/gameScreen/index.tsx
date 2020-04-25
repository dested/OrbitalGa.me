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
  label: {fontSize: '1rem', color: 'white'},
  leftJoyStick: {
    position: 'absolute',
    height: '50%',
    width: '30%',
    bottom: 0,
    left: 0,
    background: 'transparent',
  },
  rightJoystick: {
    position: 'absolute',
    height: '50%',
    width: '30%',
    bottom: 0,
    right: 0,
    background: 'transparent',
  },
  scoreItem: {
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.3rem',
    lineHeight: '0.8rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
  },
  score: {
    textAlign: 'center',
    fontFamily: 'kenney_spaceregular',
    fontSize: '0.7rem',
    color: 'white',
    marginBottom: '1rem',
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
        setDisconnected(false);
        client.joinGame();
      },
      onDisconnect: () => {
        setDisconnected(true);
      },
    });
  }, []);

  const connect = useCallback(() => {
    GameData.joinGame(uiStore.serverPath!, {
      onError: (client: ClientGame, error: STOCError) => {},
      onDied: () => {
        setDied(true);
      },
      onUIUpdate: () => {
        setTick(Math.random());
      },
      onReady: () => {},
      onOpen: (client) => {
        setDisconnected(false);
        client.joinGame();
      },
      onDisconnect: () => {
        setDisconnected(true);
      },
    });
  }, [uiStore.serverPath]);

  const revive = useCallback(() => {
    setDied(false);
    setDisconnected(false);
    connect();
  }, []);

  const managerListenerMove = useCallback((manager: JoystickManager) => {
    const onMove = (evt: EventData, stick: JoystickOutputData) => {
      GameData.client?.liveEntity?.setKey('left', false);
      GameData.client?.liveEntity?.setKey('down', false);
      GameData.client?.liveEntity?.setKey('right', false);
      GameData.client?.liveEntity?.setKey('up', false);
      switch (true) {
        case stick.vector.x < -0.3:
          GameData.client?.liveEntity?.setKey('left', true);
          break;
        case stick.vector.x > 0.3:
          GameData.client?.liveEntity?.setKey('right', true);
          break;
      }
      switch (true) {
        case stick.vector.y > 0.3:
          GameData.client?.liveEntity?.setKey('up', true);
          break;
        case stick.vector.y < -0.3:
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
    <>
      <Weapons tick={tick} />
      <Wrapper>
        {disconnected && !died && (
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
            <Logo>You Died</Logo>
            <div style={{marginLeft: '1rem', marginRight: '1rem', marginBottom: '0.5rem'}}>
              <div style={styles.score}>Rank: {GameData.client?.myScore?.rank}</div>
              <div style={styles.scoreItem}>
                <span>Score</span>
                <span>{GameData.client?.myScore?.calculatedScore}</span>
              </div>
              <div style={styles.scoreItem}>
                <span>Alive Time</span>
                <span>{Math.round((GameData.client?.myScore?.aliveTime ?? 0) / 1000)} seconds</span>
              </div>
              <div style={styles.scoreItem}>
                <span>Damage Given</span>
                <span>{GameData.client?.myScore?.damageGiven}</span>
              </div>
              <div style={styles.scoreItem}>
                <span>Damage Taken</span>
                <span>{GameData.client?.myScore?.damageTaken}</span>
              </div>
              <div style={styles.scoreItem}>
                <span>Enemies Killed</span>
                <span>{GameData.client?.myScore?.enemiesKilled}</span>
              </div>
              <div style={styles.scoreItem}>
                <span>Events Participated In</span>
                <span>{GameData.client?.myScore?.eventsParticipatedIn}</span>
              </div>
              <div style={styles.scoreItem}>
                <span>Shots Fired</span>
                <span>{GameData.client?.myScore?.shotsFired}</span>
              </div>
            </div>
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
    </>
  );
});
