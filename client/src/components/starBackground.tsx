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
    context.translate(-box.x * 2, -box.y);

    context.translate(0, frame.current / 2);
    const starMultiple = 30;
    for (const element of getStars(
      starMultiple,
      view.viewX + box.x,
      view.viewY,
      frame.current,
      view.viewWidth,
      view.viewHeight
    )) {
      context.beginPath();
      context.fillStyle = `rgba(255,255,255,${element.n / 2})`;
      context.arc(
        element.x + (starMultiple - element.n * starMultiple) / 2,
        element.y + (starMultiple - element.n * starMultiple) / 2,
        Math.abs((starMultiple * element.n) / 2),
        0,
        Math.PI * 2
      );
      context.fill();
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
