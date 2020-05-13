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
import {OrbitalGame} from '@common/game/game';
import {IServerSync} from './IServerSync';
import {IServerSocket} from '@common/socket/models';
import {TwoVector} from '@common/utils/twoVector';
import {Entity} from '@common/baseEntities/entity';
import {PhysicsEntity} from '@common/baseEntities/physicsEntity';

export class OrbitalServerEngine extends ServerEngine {
  game: OrbitalGame;

  constructor(serverSocket: IServerSocket, serverSync: IServerSync, game: OrbitalGame) {
    super(serverSocket, serverSync, game);
    this.game = game;
  }

  assignActor(entity: Entity): void {}

  gameTick(tickIndex: number, duration: number): void {
    this.processGameRules(tickIndex);

    this.game.step(false, duration);

    if (tickIndex % 120 === 0) {
      this.updateSpectatorPosition();
    }
    if (tickIndex % 180 === 0) {
      this.serverSync.syncLeaderboard();
    }
  }

  initGame(): void {
    this.game.addObjectToWorld(new SpectatorEntity(this.game, {entityId: nextId()}));
    this.updateSpectatorPosition();
  }
  setDebug(key: string, value: number | string): void {}

  userJoin(connectionId: number) {
    const socketConnection = super.userJoin(connectionId);
    if (!socketConnection || 'spectator' in socketConnection.jwt) return socketConnection;

    const startingPos = this.game.entityClusterer.getNewPlayerXPosition();
    const playerEntity = new ServerPlayerEntity(this.game, {
      type: 'player',
      entityId: nextId(),
      playerColor: PlayerEntity.randomEnemyColor(),
      health: GameRules.player.base.startingHealth,
      position: {x: startingPos, y: GameConstants.playerStartingY},
      hit: false,
      badges: [],
    });
    this.gameLeaderboard?.addPlayer(playerEntity.entityId, socketConnection.jwt.userId);
    this.users.push({name: socketConnection.jwt.userName, connectionId, entity: playerEntity});
    this.game.addObjectToWorld(playerEntity);

    const playerShieldEntity = new PlayerShieldEntity(this.game, {
      entityId: nextId(),
      ownerEntityId: playerEntity.entityId,
      shieldStrength: 'small',
      health: GameRules.playerShield.small.maxHealth,
      depleted: false,
    });
    this.game.addObjectToWorld(playerShieldEntity);
    playerEntity.setShieldEntity(playerShieldEntity.entityId);

    this.sendMessageToClient(connectionId, {
      type: 'joined',
      serverVersion: GameConstants.serverVersion,
      playerEntityId: playerEntity.entityId,
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
              position: new TwoVector(
                this.game.entityClusterer.getNewEnemyXPositionInGroup(grouping),
                -GameConstants.screenSize.height * 0.1 + Math.random() * GameConstants.screenSize.height * 0.15
              ),
              enemyColor: SwoopingEnemyEntity.randomEnemyColor(),
              health: GameRules.enemies.swoopingEnemy.startingHealth,
              hit: false,
            });
            this.game.addObjectToWorld(swoopingEnemyEntity);
          }
        }
      }
    }

    if (tickIndex === 50) {
      const groupings = this.game.entityClusterer.getGroupings((a) => a.type === 'player');
      // new BossEvent1Entity(this, nextId(), groupings[groupings.length - 1].x1 - groupings[0].x0);
    }

    if (tickIndex % 500 === 1) {
      if (GameDebug.meteorCluster) {
        const groupings = this.game.entityClusterer.getGroupings((a) => a.type === 'player');
        for (let i = groupings[0].x0; i < groupings[groupings.length - 1].x1; i += 100) {
          const meteor = new MeteorEntity(this.game, {
            entityId: nextId(),
            position: {x: i, y: GameConstants.screenSize.height * 0.55},
            meteorColor: 'brown',
            size: 'big',
            meteorType: '4',
            hit: false,
            velocity: {x: 0, y: 100},
            rotateSpeed: 0.5,
          });
          this.game.addObjectToWorld(meteor);
        }
      } else {
        for (const grouping of this.game.entityClusterer.getGroupings((a) => a.type === 'player')) {
          for (let i = 0; i < 10; i++) {
            const {meteorColor, type, size} = MeteorEntity.randomMeteor();
            const meteor = new MeteorEntity(this.game, {
              entityId: nextId(),
              position: {
                x: Utils.randomInRange(grouping.x0, grouping.x1),
                y: -GameConstants.screenSize.height * 0.1 + Math.random() * GameConstants.screenSize.height * 0.15,
              },
              meteorColor,
              size,
              meteorType: type,
              hit: false,
              angle: Math.round(Math.random() * 255),
              velocity: {x: Math.random() * 100 - 50, y: 50 + Math.random() * 100},
              rotateSpeed: Math.random() * 0.5 + 0.3,
            });

            this.game.addObjectToWorld(meteor);
          }
        }
      }
    }
  }

  private updateSpectatorPosition() {
    const range = this.game.getPlayerRange(0, (e) => e instanceof PhysicsEntity && e.position.y > 30);
    const spectator = this.game.spectatorEntity;
    if (!spectator) {
      return;
    }
    spectator.position.set(range.x0 + Math.random() * (range.x1 - range.x0), 0);
  }
}
