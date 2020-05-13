import {SwoopingEnemyEntity, SwoopingEnemyModel} from '@common/entities/swoopingEnemyEntity';
import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {OrbitalAssets} from '../../utils/assetManager';
import {GameRules} from '@common/game/gameRules';
import {CanvasUtils} from '../../utils/canvasUtils';

export class SwoopingEnemyActor extends ClientActor<SwoopingEnemyEntity> {
  static _whiteEnemy?: HTMLCanvasElement;
  clientDestroyedTick?: number = undefined;

  hitTimer = 0;
  zIndex = DrawZIndex.Player;

  get drawX() {
    return this.entity.position.x;
  }

  get drawY() {
    return this.entity.position.y;
  }

  get ship() {
    switch (this.entity.enemyColor) {
      case 'black':
        return OrbitalAssets.assets['Enemies.enemyBlack1'];
      case 'blue':
        return OrbitalAssets.assets['Enemies.enemyBlue1'];
      case 'green':
        return OrbitalAssets.assets['Enemies.enemyGreen1'];
      case 'red':
        return OrbitalAssets.assets['Enemies.enemyRed1'];
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    const ship = this.ship;
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(ship.image, -ship.size.width / 2, -ship.size.height / 2);

    if (this.hitTimer > 0) {
      context.save();
      context.globalAlpha = this.hitTimer / 5;
      context.drawImage(SwoopingEnemyActor.whiteEnemy(), -ship.size.width / 2, -ship.size.height / 2);
      context.restore();
      this.hitTimer -= 1;
    }
    context.restore();

    this.drawHealth(context);
  }

  drawHealth(context: CanvasRenderingContext2D) {
    const ship = this.ship;
    context.fillStyle = 'rgba(255,255,255,0.4)';
    context.fillRect(this.drawX - ship.size.width / 2, this.drawY - ship.size.height / 2 - 8, ship.size.width, 5);
    context.fillStyle = 'rgba(254,0,0,0.4)';
    context.fillRect(
      this.drawX - ship.size.width / 2 + 1,
      this.drawY - ship.size.height / 2 + 1 - 8,
      (ship.size.width - 2) * (this.entity.health / GameRules.enemies.swoopingEnemy.startingHealth),
      3
    );
  }

  reconcileFromServer(messageModel: SwoopingEnemyModel) {
    super.reconcileFromServer(messageModel);
    if (this.entity.hit) {
      this.hitTimer = 5;
    }
  }

  tick() {}

  static whiteEnemy() {
    if (!this._whiteEnemy) {
      this._whiteEnemy = CanvasUtils.mask(OrbitalAssets.assets['Enemies.enemyBlack1'], 255, 255, 255);
    }
    return this._whiteEnemy!;
  }
}
