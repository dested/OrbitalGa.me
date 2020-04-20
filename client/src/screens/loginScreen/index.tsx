import React, {useCallback, useEffect, useState} from 'react';
import './index.css';
import {observer} from 'mobx-react';
import {useStores} from '../../store/stores';
import {JoinButton, LoginBox, Logo, NameBox, Status, Wrapper} from './index.styles';
import {GoFullScreen} from '../../components/goFullScreen';
import {GameConstants} from '@common/game/gameConstants';
import {GameData} from '../../game/gameData';
import {ClientGame} from '../../game/clientGame';
import {unreachable} from '@common/utils/unreachable';
import {Leaderboard} from '../../components/leaderboard';
import {STOCError} from '@common/models/serverToClientMessages';

const styles = {
  buttonList: {display: 'flex', width: '100%'},
  canvas: {width: '100vw', height: '100vh', position: 'absolute', zIndex: -99},
  label: {fontSize: '1rem', color: 'white'},
} as const;

export const LoginScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const [connectStatus, setConnectingStatus] = useState<'none' | 'connecting'>('none');
  const [error, setError] = useState('');

  useEffect(() => {
    onJoin('1');
  }, []);

  const servers = ['1' /*, '2', '3', '4', '11'*/];

  const onJoin = useCallback(async (server: string) => {
    uiStore.setServerPath(server);
    setError('');
    setConnectingStatus('connecting');
    GameData.joinGame(uiStore.serverPath!, uiStore.playerName!, {
      onError: (client: ClientGame, errorMessage: STOCError) => {
        switch (errorMessage.reason) {
          case 'nameInUse':
            setError('This username is already taken');
            setConnectingStatus('none');
            break;
          case 'spectatorCapacity':
            setError('Sorry, this server is at spectator capacity');
            setConnectingStatus('none');
            break;
          case 'userCapacity':
            setError('Sorry, this server is at player capacity');
            setConnectingStatus('none');
            break;
          case '500':
            setError('An error has occurred');
            setConnectingStatus('none');
            break;
          default:
            unreachable(errorMessage);
        }
      },
      onDied: () => {},
      onUIUpdate: () => {},
      onReady: () => {
        uiStore.setScreen('game');
      },
      onOpen: (client) => {
        client.joinGame(uiStore.playerName!);
      },
      onDisconnect: () => {},
    });
  }, []);

  return (
    <Wrapper>
      <canvas
        id={'game'}
        width={GameConstants.screenSize.width}
        height={GameConstants.screenSize.height}
        style={styles.canvas}
      />
      <LoginBox>
        <Logo>Orbital</Logo>
        <NameBox
          placeholder={'Name'}
          value={uiStore.playerName}
          maxLength={10}
          onChange={(e: any) => uiStore.setPlayerName(e.target.value)}
        />
        {error && <span style={styles.label}>{error}</span>}
        {uiStore.serverIsDown && <span style={styles.label}>Server is down...</span>}
        {(connectStatus === 'none' && (
          <div style={styles.buttonList}>
            {servers.map((s) => (
              <JoinButton key={s} onClick={() => onJoin(s)}>
                Join {GameConstants.isSinglePlayer ? 'Single Player' : 'Server'}
              </JoinButton>
            ))}
          </div>
        )) ||
          (connectStatus === 'connecting' && <Status>Connecting...</Status>)}
      </LoginBox>
      <Leaderboard tick={0} />
      <GoFullScreen />
    </Wrapper>
  );
});
