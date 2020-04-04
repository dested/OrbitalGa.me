import React, {useEffect, useRef} from 'react';
import {useAnimationFrame} from '../hooks/useAnimationFrame';
import {GameData} from '../game/gameData';
import {AssetManager} from '../utils/assetManager';
import {GameConstants} from '@common/game/gameConstants';
import {useShowGoFullScreen} from '../hooks/useWindowSize';

export const GoFullScreen: React.FC = (props) => {
  const showGoFullScreen = useShowGoFullScreen();
  if (!showGoFullScreen) {
    return <></>;
  }
  return (
    <button
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        border: 0,
        background: 'white',
        color: 'black',
        padding: 10,
        fontSize: '1.3em',
      }}
      onClick={() => {
        const video = document.documentElement as any;
        const rfs =
          video.requestFullscreen ||
          video.webkitRequestFullScreen ||
          video.mozRequestFullScreen ||
          video.msRequestFullscreen;
        rfs.call(video);

        // eslint-disable-next-line no-restricted-globals
        screen.orientation.lock('landscape-primary');
      }}
    >
      Go Fullscreen And Rotate
    </button>
  );
};
