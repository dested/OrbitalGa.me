import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {nextId} from '@common/utils/uuid';
import {ServerPlayerEntity} from './entities/serverPlayerEntity';
import {PlayerEntity} from '@common/entities/playerEntity';
import {GameRules} from '@common/game/gameRules';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {PlayerShieldEntity} from '@common/entities/playerShieldEntity';
import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {MeteorEntity} from '@common/entities/meteorEntity';
import {Utils} from '@common/utils/utils';
import {ServerEngine} from './serverEngine';

export class OrbitalServerEngine extends ServerEngine {
  gameTick(tickIndex: number, duration: number): void {
    this.processGameRules(tickIndex);

    this.game.gameTick(tickIndex, duration);

    if (tickIndex % 15 === 0) {
      this.updateSpectatorPosition();
    }
    if (tickIndex % 30 === 0) {
      this.serverSync.syncLeaderboard();
    }
  }

  initGame(): void {
    this.game.entities.push(new SpectatorEntity(this.game, {entityId: nextId(), x: 0, y: 0}));
    this.updateSpectatorPosition();
  }

  userJoin(connectionId: number) {
    const socketConnection = super.userJoin(connectionId);
    if (!socketConnection || 'spectator' in socketConnection.jwt) return socketConnection;

    const startingPos = this.game.entityClusterer.getNewPlayerXPosition();
    const playerEntity = new ServerPlayerEntity(this.game, {
      entityId: nextId(),
      playerColor: PlayerEntity.randomEnemyColor(),
      health: GameRules.player.base.startingHealth,
      x: startingPos,
      y: GameConstants.playerStartingY,
      playerInputKeys: {shoot: false, right: false, left: false, down: false, up: false},
      hit: false,
      badges: [],
    });
    this.gameLeaderboard!.addPlayer(playerEntity.entityId, socketConnection.jwt.userId);
    this.users.push({name, connectionId, entity: playerEntity});
    this.game.entities.push(playerEntity);

    const playerShieldEntity = new PlayerShieldEntity(this.game, {
      entityId: nextId(),
      ownerEntityId: playerEntity.entityId,
      shieldStrength: 'small',
      health: GameRules.playerShield.small.maxHealth,
      depleted: false,
      x: 0,
      y: 0,
    });
    this.game.entities.push(playerShieldEntity);
    playerEntity.setShieldEntity(playerShieldEntity.entityId);

    this.sendMessageToClient(connectionId, {
      type: 'joined',
      serverVersion: GameConstants.serverVersion,
      player: playerEntity.serializeLive(),
    });
    return socketConnection;
  }

  private processGameRules(tickIndex: number) {
    if (!GameDebug.noEnemies) {
      for (const grouping of this.game.entityClusterer.getGroupings(
        (a) => a.type === 'player' || a.type === 'swoopingEnemy'
      )) {
        const enemies = grouping.entities.filter((a) => a.type === 'swoopingEnemy').length;
        const players = Math.ceil(Math.min(grouping.entities.filter((a) => a.type === 'player').length, 4) * 1.5);
        if (enemies < players) {
          for (let i = enemies; i < players; i++) {
            const swoopingEnemyEntity = new SwoopingEnemyEntity(this.game, {
              entityId: nextId(),
              x: this.game.entityClusterer.getNewEnemyXPositionInGroup(grouping),
              y: -GameConstants.screenSize.height * 0.1 + Math.random() * GameConstants.screenSize.height * 0.15,
              enemyColor: SwoopingEnemyEntity.randomEnemyColor(),
              health: GameRules.enemies.swoopingEnemy.startingHealth,
              hit: false,
            });
            this.game.entities.push(swoopingEnemyEntity);
          }
        }
      }
    }

    if (tickIndex === 50) {
      const groupings = this.game.entityClusterer.getGroupings((a) => a.type === 'player');
      // new BossEvent1Entity(this, nextId(), groupings[groupings.length - 1].x1 - groupings[0].x0);
    }

    if (tickIndex % 50 === 1) {
      if (GameDebug.meteorCluster) {
        const groupings = this.game.entityClusterer.getGroupings((a) => a.type === 'player');
        for (let i = groupings[0].x0; i < groupings[groupings.length - 1].x1; i += 100) {
          const meteor = new MeteorEntity(this.game, {
            entityId: nextId(),
            x: i,
            y: GameConstants.screenSize.height * 0.55,
            meteorColor: 'brown',
            size: 'big',
            meteorType: '4',
            hit: false,
            rotate: 100,
            momentumX: 0,
            momentumY: 20,
            rotateSpeed: 3,
          });
          this.game.entities.push(meteor);
        }
      } else {
        for (const grouping of this.game.entityClusterer.getGroupings((a) => a.type === 'player')) {
          for (let i = 0; i < 10; i++) {
            const {meteorColor, type, size} = MeteorEntity.randomMeteor();
            const meteor = new MeteorEntity(this.game, {
              entityId: nextId(),
              x: Utils.randomInRange(grouping.x0, grouping.x1),
              y: -GameConstants.screenSize.height * 0.1 + Math.random() * GameConstants.screenSize.height * 0.15,
              meteorColor,
              size,
              meteorType: type,
              hit: false,
              rotate: Math.random() * 255,
              momentumX: Math.random() * 10 - 5,
              rotateSpeed: Math.round(1 + Math.random() * 3),
              momentumY: 5 + Math.random() * 10,
            });

            this.game.entities.push(meteor);
          }
        }
      }
    }
  }

  private updateSpectatorPosition() {
    const range = this.game.getPlayerRange(0, (e) => e.y > 30);
    const spectator = this.game.entities.array.find((a) => a instanceof SpectatorEntity);
    if (!spectator) {
      return;
    }
    spectator.x = range.x0 + Math.random() * (range.x1 - range.x0);
    spectator.y = 0;
  }
}
