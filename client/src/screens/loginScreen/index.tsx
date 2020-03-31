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

  const onJoin = useCallback(async () => {
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
        <NameBox value={name} onChange={(e: any) => setName(e.target.value)} />
        {(connectStatus === 'none' && <JoinButton onClick={onJoin}>Join</JoinButton>) ||
          (connectStatus === 'connecting' && <Status>Connecting...</Status>) ||
          (connectStatus === 'joining' && <Status>Joining...</Status>)}
      </LoginBox>
    </Wrapper>
  );
});
