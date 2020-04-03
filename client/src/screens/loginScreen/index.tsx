import React, {useCallback, useEffect, useState} from 'react';
import './index.css';
import {observer} from 'mobx-react';
import {useStores} from '../../store/stores';
import {JoinButton, LoginBox, Logo, NameBox, Status, Wrapper} from './index.styles';
import {Utils} from '@common/utils/utils';

export const LoginScreen: React.FC = observer((props) => {
  const {uiStore} = useStores();
  const [name, setName] = useState('');
  const [connectStatus, setConnectingStatus] = useState<'none' | 'fail' | 'connecting' | 'joining' | 'joined'>('none');
  useEffect(() => {}, []);

  const servers = ['1', '2', '3', '4', '11'];

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
      <LoginBox>
        <Logo>Orbital</Logo>
        <NameBox placeholder={'Name'} value={name} onChange={(e: any) => setName(e.target.value)} />
        {(connectStatus === 'none' && (
          <div style={{display: 'flex', width: '100%'}}>
            {servers.map((s) => (
              <JoinButton key={s} onClick={() => onJoin(s)}>
                Join Server {s}
              </JoinButton>
            ))}
          </div>
        )) ||
          (connectStatus === 'connecting' && <Status>Connecting...</Status>) ||
          (connectStatus === 'joining' && <Status>Joining...</Status>)}
      </LoginBox>
    </Wrapper>
  );
});
