import {LivePlayerModel, PlayerBadges, PlayerEntity, PlayerInput, PlayerModel} from '@common/entities/playerEntity';
import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';
import {GameRules} from '@common/game/gameRules';
import {OrbitalAssets} from '../../utils/assetManager';
import {CanvasUtils} from '../../utils/canvasUtils';
import {unreachable} from '@common/utils/unreachable';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {OrbitalGame} from '@common/game/game';
import {DropEntity} from '@common/entities/dropEntity';

export class ClientPlayerActor extends ClientActor<PlayerEntity> {
  static _greenPlayer?: HTMLCanvasElement;
  static _whitePlayer?: HTMLCanvasElement;
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
    switch (this.entity.playerColor) {
      case 'blue':
        return OrbitalAssets.assets['Ships.playerShip1_blue'];
      case 'green':
        return OrbitalAssets.assets['Ships.playerShip1_green'];
      case 'orange':
        return OrbitalAssets.assets['Ships.playerShip1_orange'];
      case 'red':
        return OrbitalAssets.assets['Ships.playerShip1_red'];
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    const ship = this.ship;

    if (GameDebug.clientServerView) {
      context.save();
      context.globalAlpha = 0.7;
      context.translate(this.entity.position.x, this.entity.position.y);
      context.drawImage(ClientPlayerActor.greenPlayer(), -ship.size.width / 2, -ship.size.height / 2);
      context.restore();
      return;
    }
    this.drawFire(context);

    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(ship.image, -ship.size.width / 2, -ship.size.height / 2);

    if (this.hitTimer > 0) {
      context.save();
      context.globalAlpha = this.hitTimer / 5;
      context.drawImage(ClientPlayerActor.whitePlayer(), -ship.size.width / 2, -ship.size.height / 2);
      context.restore();
      this.hitTimer -= 1;
    }
    context.restore();
    this.drawHealthAndRank(context);
  }

  /* todo maybe make this on the actor class, add PlayerModel as static type on entity idk
  reconcileFromServer(messageModel: PlayerModel) {
    const wasHit = this.entity.hit;
    this.entity.reconcileFromServer(messageModel);
    if (this.entity.hit !== wasHit) {
      this.hitTimer = 5;
    }
  }
*/

  tick() {}

  private drawFire(context: CanvasRenderingContext2D) {
    if (this.entity.lastPlayerInput?.up) {
      context.save();
      const fire =
        this.entity.game.stepCount % 8 < 4
          ? OrbitalAssets.assets['Effects.fire16']
          : OrbitalAssets.assets['Effects.fire17'];
      context.drawImage(fire.image, this.drawX - 30, this.drawY + 20);
      context.drawImage(fire.image, this.drawX + 16, this.drawY + 20);
      context.restore();
    } else if (
      this.entity.lastPlayerInput?.down ||
      this.entity.lastPlayerInput?.left ||
      this.entity.lastPlayerInput?.right
    ) {
      context.save();
      const fire =
        this.entity.game.stepCount % 8 < 4
          ? OrbitalAssets.assets['Effects.fire16']
          : OrbitalAssets.assets['Effects.fire17'];
      context.drawImage(fire.image, this.drawX - 30, this.drawY + 10);
      context.drawImage(fire.image, this.drawX + 16, this.drawY + 10);
      context.restore();
    }
  }

  private drawHealthAndRank(context: CanvasRenderingContext2D) {
    const ship = this.ship;
    context.fillStyle = 'rgba(255,255,255,0.4)';
    context.fillRect(this.drawX - ship.size.width / 2, this.drawY + ship.size.height / 2, ship.size.width, 5);
    context.fillStyle = 'rgba(254,0,0,0.4)';
    context.fillRect(
      this.drawX - ship.size.width / 2 + 1,
      this.drawY + ship.size.height / 2 + 1,
      (ship.size.width - 2) * (this.entity.health / GameRules.player.base.startingHealth),
      3
    );

    const badgeSize = 20;

    const startBadgeY = this.drawY + ship.size.height / 2 + 7;
    const startBadgeX = this.drawX - ship.size.width / 2 - 10;
    let curBadgeX = 0;
    let curBadgeY = 0;

    const badgePadding = 5;
    const maxWidth = ship.size.width + 20;

    for (const badge of this.entity.badges) {
      const badgeAsset = ClientPlayerActor.getBadgeAsset(badge);
      context.drawImage(badgeAsset.image, curBadgeX + startBadgeX, curBadgeY + startBadgeY, badgeSize, badgeSize);
      curBadgeX += badgeSize + badgePadding;
      if (curBadgeX > maxWidth) {
        curBadgeX = 0;
        curBadgeY += badgeSize + badgePadding;
      }
    }
  }
  static greenPlayer() {
    if (!this._greenPlayer) {
      this._greenPlayer = CanvasUtils.mask(OrbitalAssets.assets['Ships.playerShip1_blue'], 0, 255, 0);
    }
    return this._greenPlayer!;
  }

  static whitePlayer() {
    if (!this._whitePlayer) {
      this._whitePlayer = CanvasUtils.mask(OrbitalAssets.assets['Ships.playerShip1_blue'], 255, 255, 255);
    }
    return this._whitePlayer!;
  }

  private static getBadgeAsset(badge: PlayerBadges) {
    switch (badge.rank) {
      case 'bolt':
        switch (badge.level) {
          case 'bronze':
            return OrbitalAssets.assets['Power_ups.bolt_bronze'];
          case 'silver':
            return OrbitalAssets.assets['Power_ups.bolt_silver'];
          case 'gold':
            return OrbitalAssets.assets['Power_ups.bolt_gold'];
          default:
            throw unreachable(badge.level);
        }
      case 'shield':
        switch (badge.level) {
          case 'bronze':
            return OrbitalAssets.assets['Power_ups.shield_bronze'];
          case 'silver':
            return OrbitalAssets.assets['Power_ups.shield_silver'];
          case 'gold':
            return OrbitalAssets.assets['Power_ups.shield_gold'];
          default:
            throw unreachable(badge.level);
        }
      case 'star':
        switch (badge.level) {
          case 'bronze':
            return OrbitalAssets.assets['Power_ups.star_bronze'];
          case 'silver':
            return OrbitalAssets.assets['Power_ups.star_silver'];
          case 'gold':
            return OrbitalAssets.assets['Power_ups.star_gold'];
          default:
            throw unreachable(badge.level);
        }
      case 'badge':
        switch (badge.level) {
          case 'bronze':
            return OrbitalAssets.assets['Power_ups.badge_bronze'];
          case 'silver':
            return OrbitalAssets.assets['Power_ups.badge_silver'];
          case 'gold':
            return OrbitalAssets.assets['Power_ups.badge_gold'];
          default:
            throw unreachable(badge.level);
        }
      default:
        throw unreachable(badge.rank);
    }
  }
}
