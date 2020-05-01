export function mplayTester() {
  const player = new Player();
  player.moveDown();
  for (let i = 0; i < 5; i++) {
    player.tick();
    console.log(player.y, player.momentumY);
  }
}

class Player {
  actions: {actionTick: number}[] = [];
  actionTickCount = 0;
  momentumY: number = 0;
  y: number = 0;

  moveDown() {
    this.momentumY = 10;
    this.actions.push({
      actionTick: this.actionTickCount++,
    });
  }

  tick() {
    this.y += this.momentumY;
    this.momentumY *= 0.25;
    if (this.momentumY < 1) {
      this.momentumY = 0;
    }
  }
}
