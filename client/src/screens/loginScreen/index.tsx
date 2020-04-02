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

  const onJoin1 = useCallback(async () => {
    uiStore.setServerPath('1');
    setConnectingStatus('connecting');
    await Utils.timeout(100);
    setConnectingStatus('joining');
    await Utils.timeout(100);
    uiStore.setScreen('game');
  }, []);
  const onJoin2 = useCallback(async () => {
    uiStore.setServerPath('2');
    setConnectingStatus('connecting');
    await Utils.timeout(100);
    setConnectingStatus('joining');
    await Utils.timeout(100);
    uiStore.setScreen('game');
  }, []);
  const onJoin3 = useCallback(async () => {
    uiStore.setServerPath('3');
    setConnectingStatus('connecting');
    await Utils.timeout(100);
    setConnectingStatus('joining');
    await Utils.timeout(100);
    uiStore.setScreen('game');
  }, []);

  const onJoin4 = useCallback(async () => {
    uiStore.setServerPath('4');
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
            <JoinButton onClick={onJoin1}>Join Server 1</JoinButton>
            <JoinButton onClick={onJoin2}>Join Server 2</JoinButton>
            <JoinButton onClick={onJoin3}>Join Server 3</JoinButton>
            <JoinButton onClick={onJoin4}>Join Server 4</JoinButton>
          </div>
        )) ||
          (connectStatus === 'connecting' && <Status>Connecting...</Status>) ||
          (connectStatus === 'joining' && <Status>Joining...</Status>)}
      </LoginBox>
    </Wrapper>
  );
});
