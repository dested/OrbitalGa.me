export const ShakeGame = (magnitude = 16) => {
  return;
  if (typeof document === 'undefined') return;
  const element = document.getElementById('game')!;
  let counter = 1;
  const numberOfShakes = 15;
  const startX = 0;
  const startY = 0;
  const magnitudeUnit = magnitude / numberOfShakes;

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  upAndDownShake();

  function upAndDownShake() {
    if (counter < numberOfShakes) {
      element.style.transform = 'translate(' + startX + 'px, ' + startY + 'px)';
      magnitude -= magnitudeUnit;
      const randomX = randomInt(-magnitude, magnitude);
      const randomY = randomInt(-magnitude, magnitude);
      element.style.transform = 'translate(' + randomX + 'px, ' + randomY + 'px)';
      counter += 1;
      requestAnimationFrame(upAndDownShake);
    }
    if (counter >= numberOfShakes) {
      element.style.transform = 'translate(' + startX + ', ' + startY + ')';
    }
  }
};
