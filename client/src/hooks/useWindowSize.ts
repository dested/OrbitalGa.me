import {useEffect, useState} from 'react';
import {Utils} from '@common/utils/utils';

export function useWindowSize() {
  function getSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    function handleResize() {
      setWindowSize(getSize());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

export function useShowGoFullScreen() {
  const windowSize = useWindowSize();
  const isMobile = Utils.isMobile();

  return windowSize.width < windowSize.height && isMobile;
}
