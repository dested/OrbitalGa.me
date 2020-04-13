import React, {useCallback, useEffect, useState} from 'react';
import './index.css';
import {observer} from 'mobx-react';
import {useStores} from '../../store/stores';
import {JoinButton, LoginBox, Logo, NameBox, Status, Wrapper} from './index.styles';
import {Utils} from '@common/utils/utils';
import {GoFullScreen} from '../../components/goFullScreen';
import {GameConstants} from '@common/game/gameConstants';

const styles = {
  buttonList: {display: 'flex', width: '100%'},
  canvas: {width: '100vw', height: '100vh', position: 'absolute', zIndex: -99},
} as const;

export const LoginScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const [name, setName] = useState('');
  const [connectStatus, setConnectingStatus] = useState<'none' | 'fail' | 'connecting' | 'joining' | 'joined'>('none');
  useEffect(() => {
    // onJoin('1')
  }, []);

  const servers = ['1' /*, '2', '3', '4', '11'*/];

  const onJoin = useCallback(async (server: string) => {
    uiStore.setServerPath(server);
    setConnectingStatus('connecting');
    await Utils.timeout(100);
    setConnectingStatus('joining');
    await Utils.timeout(100);
    uiStore.setScreen('game');
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
        <NameBox placeholder={'Name'} value={name} onChange={(e: any) => setName(e.target.value)} />
        {(connectStatus === 'none' && (
          <div style={styles.buttonList}>
            {servers.map((s) => (
              <JoinButton key={s} onClick={() => onJoin(s)}>
                Join {GameConstants.singlePlayer ? 'Single Player' : 'Server'}
              </JoinButton>
            ))}
          </div>
        )) ||
          (connectStatus === 'connecting' && <Status>Connecting...</Status>) ||
          (connectStatus === 'joining' && <Status>Joining...</Status>)}
      </LoginBox>
      <GoFullScreen />
    </Wrapper>
  );
});
