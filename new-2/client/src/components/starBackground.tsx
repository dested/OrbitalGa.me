import React, {useEffect, useRef, useState} from 'react';
import {useAnimationFrame} from '../hooks/useAnimationFrame';
import {getStars} from '../game/components/stars';
import {GameData} from '../game/gameData';

export const StarBackground: React.FC = props => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  useEffect(() => {
    if (!canvas.current) return;
  }, [canvas]);

  useAnimationFrame(() => {
    if (!canvas.current) return;
    const context = canvas.current.getContext('2d')!;
    context.fillStyle = '#000022';
    context.fillRect(0, 0, canvas.current.width, canvas.current.height);
    frame.current++;
    context.save();
    const view = GameData.instance.view;

    const outerBox = view.outerViewBox;
    const box = view.viewBox;
    context.scale(view.scale, view.scale);
    context.translate(-box.x, -box.y);

    context.translate(0, frame.current / 2);
    for (const element of getStars(view.viewX, view.viewY, frame.current, view.viewWidth, view.viewHeight)) {
      context.fillStyle = `rgba(255,255,255,${element.n / 2})`;
      context.fillRect(
        element.x + (16 - element.n * 16) / 2,
        element.y + (16 - element.n * 16) / 2,
        16 * element.n,
        16 * element.n
      );
    }
    context.restore();
  });

  return (
    <canvas
      style={{position: 'absolute', zIndex: -100}}
      ref={canvas}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
};
