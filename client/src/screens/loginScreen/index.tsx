import React, {useCallback, useEffect, useState} from 'react';
import './index.css';
import {observer} from 'mobx-react';
import {useStores} from '../../store/stores';
import {JoinButton, LeaderboardButton, LoginBox, Logo, NameBox, Status, Wrapper} from './index.styles';
import {GoFullScreen} from '../../components/goFullScreen';
import {GameConstants} from '@common/game/gameConstants';
import {GameData} from '../../game/gameData';
import {ClientGame} from '../../game/clientGame';
import {unreachable} from '@common/utils/unreachable';
import {Leaderboard} from '../../components/leaderboard';
import {STOCError} from '@common/models/serverToClientMessages';
import {useApolloClient} from 'react-apollo-hooks';
import {
  LoginAnonymousDocument,
  LoginAnonymousMutation,
  LoginAnonymousMutationVariables,
} from '../../schema/generated/graphql';
import {makeJwt} from '../../utils/jwt';

const styles = {
  buttonList: {display: 'flex', width: '100%'},
  canvas: {width: '100vw', height: '100vh', position: 'absolute', zIndex: -99},
  label: {fontSize: '1rem', color: 'white'},
} as const;

export const LoginScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const [connectStatus, setConnectingStatus] = useState<'none' | 'loggingIn' | 'connecting'>('none');
  const [error, setError] = useState('');
  const apolloClient = useApolloClient();

  useEffect(() => {}, []);

  const onLeaderboard = useCallback(() => {
    uiStore.setScreen('leaderboard');
  }, []);
  const onJoin = useCallback(async () => {
    setError('');
    if (!GameConstants.isSinglePlayer) {
      setConnectingStatus('loggingIn');
      const result = await apolloClient.mutate<LoginAnonymousMutation, LoginAnonymousMutationVariables>({
        mutation: LoginAnonymousDocument,
        variables: {userName: uiStore.playerName},
      });
      switch (result.data?.loginAnonymous.__typename) {
        case 'ErrorResponse':
          alert(result.data?.loginAnonymous.error);
          return;
        case 'LoginSuccess': {
          uiStore.setJwt(makeJwt(result.data?.loginAnonymous.jwt));
          if (result.data?.loginAnonymous.gameModel) {
            uiStore.setServerPath(result.data?.loginAnonymous.gameModel.serverUrl);
          } else {
            GameConstants.isSinglePlayer = true;
          }
          break;
        }
      }
    }
    setConnectingStatus('connecting');
    GameData.joinGame(uiStore.serverPath!, {
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
        client.joinGame();
      },
      onDisconnect: () => {},
    });
  }, []);

  return (
    <Wrapper>
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
          <JoinButton onClick={onJoin}>Join {GameConstants.isSinglePlayer ? 'Single Player' : 'Server'}</JoinButton>
        )) ||
          (connectStatus === 'connecting' && <Status>Connecting...</Status>)}
        <LeaderboardButton onClick={onLeaderboard}>Today's Leaderboard</LeaderboardButton>
      </LoginBox>
      <Leaderboard tick={0} />
      <GoFullScreen />
    </Wrapper>
  );
});
