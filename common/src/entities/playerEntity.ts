import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {GameConstants} from '../game/gameConstants';
import {PlayerWeaponEntity} from './playerWeaponEntity';
import {nextId} from '../utils/uuid';
import {WallEntity} from './wallEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {GameRules, PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Utils} from '../utils/utils';
import {isEnemyWeapon, Weapon} from './weapon';
import {unreachable} from '../utils/unreachable';
import {DropType} from './dropEntity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from '../models/schemaEnums';
import {SDArray, SDSimpleObject, SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';

export type PlayerInputKeys = {
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  up: boolean;
};
export type PlayerInput = PlayerInputKeys & {
  weapon: PlayerWeapon | 'unset';
};
export type PlayerColor = 'blue' | 'green' | 'orange' | 'red';
export type AvailablePlayerWeapon = {ammo: number; weapon: PlayerWeapon};
export type PlayerBadges = {
  level: 'bronze' | 'silver' | 'gold';
  rank: 'bolt' | 'shield' | 'star' | 'badge';
};

export class PlayerEntity extends Entity implements Weapon {
  availableWeapons: AvailablePlayerWeapon[] = [
    {ammo: 0, weapon: 'laser1'},
    {ammo: 5, weapon: 'rocket'},
    {ammo: 3, weapon: 'torpedo'},
  ];
  badges: PlayerBadges[];
  boundingBoxes = [{width: 99, height: 75}];
  damage = 2;
  dead: boolean = false;
  explosionIntensity = 2;
  health = GameRules.player.base.startingHealth;
  hit = false;
  isWeapon = true as const;
  lastProcessedInputSequenceNumber: number = 0;
  momentumX = 0;
  momentumY = 0;
  ownerPlayerEntityId: number;
  playerColor: PlayerColor;
  selectedWeapon: PlayerWeapon = 'laser1';
  shootTimer: number = 1;
  shotSide: 'left' | 'right' = 'left';

  staticPlayersToLeft?: number;
  staticPlayersToRight?: number;
  type = 'player' as const;
  weaponSide = 'player' as const;
  xInputsThisTick: boolean = false;
  yInputsThisTick: boolean = false;
  protected lastPlayerInput?: PlayerInputKeys;
  private shieldEntityId?: number;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<Omit<PlayerModel, 'playerInputKeys'>>) {
    super(game, messageModel);
    this.ownerPlayerEntityId = messageModel.entityId;
    this.health = messageModel.health;
    this.playerColor = messageModel.playerColor;
    this.badges = messageModel.badges;
    this.createPolygon();
  }

  get playersToLeft() {
    if (this.staticPlayersToLeft !== undefined) return this.staticPlayersToLeft;
    return this.game.entities.filter((e) => e.type === 'player' && e.x < this.x - GameConstants.screenSize.width / 2)
      .length;
  }
  set playersToLeft(value: number) {
    this.staticPlayersToLeft = value;
  }
  get playersToRight() {
    if (this.staticPlayersToRight !== undefined) return this.staticPlayersToRight;
    return this.game.entities.filter((e) => e.type === 'player' && e.x > this.x + GameConstants.screenSize.width / 2)
      .length;
  }
  set playersToRight(value: number) {
    this.staticPlayersToRight = value;
  }

  get realX() {
    return this.x;
  }

  get realY() {
    return this.y;
  }

  addDrop(drop: DropType) {
    switch (drop.type) {
      case 'health':
        this.health += drop.amount;
        this.health = Math.min(this.health, GameRules.player.base.startingHealth);
        break;
      case 'weapon':
        let myWeapon = this.availableWeapons.find((a) => a.weapon === drop.weapon);
        if (!myWeapon) {
          switch (drop.weapon) {
            case 'laser1Spray10':
              this.availableWeapons.push((myWeapon = {weapon: drop.weapon, ammo: 0}));
              break;
            case 'laser1':
              return;
            case 'laser2':
              this.availableWeapons = this.availableWeapons.filter((w) => w.weapon !== 'laser1');
              if (this.selectedWeapon === 'laser1') this.selectedWeapon = 'laser2';
              this.availableWeapons.unshift((myWeapon = {weapon: drop.weapon, ammo: 0}));
              break;
            case 'rocket':
            case 'torpedo':
              this.availableWeapons.push((myWeapon = {weapon: drop.weapon, ammo: 0}));
              break;
            default:
              throw unreachable(drop.weapon);
          }
        }
        myWeapon.ammo = Math.min(myWeapon.ammo + drop.ammo, WeaponConfigs[drop.weapon].maxAmmo);
        break;
      case 'shield':
        const shield = this.game.entities.lookup<PlayerShieldEntity>(this.shieldEntityId!);
        if (shield) {
          if (drop.level === 'medium' && shield.shieldStrength === 'big') {
            shield.health = GameRules.playerShield.big.maxHealth;
          } else {
            shield.health = GameRules.playerShield[drop.level].maxHealth;
            shield.shieldStrength = drop.level;
          }
        }
        break;
      default:
        unreachable(drop);
    }
  }

  applyInput(input: PlayerInput, inputSequenceNumber: number) {
    this.lastPlayerInput = input;
    this.xInputsThisTick = false;
    this.yInputsThisTick = false;
    if (input.weapon !== 'unset') {
      this.selectedWeapon = input.weapon;
    }
    if (input.shoot) {
      if (!this.game.isClient) {
        if (this.shootTimer <= 0) {
          const availableWeapon = this.availableWeapons.find((w) => w.weapon === this.selectedWeapon);
          const config = WeaponConfigs[this.selectedWeapon];
          if (availableWeapon) {
            let canFire = false;
            switch (config.ammoType) {
              case 'infinite':
                canFire = true;
                break;
              case 'per-shot':
                if (availableWeapon.ammo > 0) {
                  canFire = true;
                }
                break;
              case 'time':
                if (availableWeapon.ammo > 0) {
                  canFire = true;
                }

                break;
            }
            if (canFire) {
              this.game.gameLeaderboard?.increaseEntry(this.entityId, 'shotsFired', 1);
              let offsetX = 0;
              if (config.alternateSide) {
                offsetX = this.shotSide === 'left' ? -42 : 42;
              }
              if (config.spray) {
                for (let i = 1; i < config.spray; i++) {
                  const playerWeaponEntity = new PlayerWeaponEntity(this.game, {
                    entityId: nextId(),
                    x: this.x + offsetX,
                    y: this.y - 6,
                    startY: this.y - 6,
                    ownerEntityId: this.entityId,
                    offsetX,
                    weaponType: this.selectedWeapon,
                    sprayAngle: Math.round(i * (180 / config.spray)),
                  });
                  this.game.entities.push(playerWeaponEntity);
                }
              } else {
                const playerWeaponEntity = new PlayerWeaponEntity(this.game, {
                  entityId: nextId(),
                  x: this.x + offsetX,
                  y: this.y - 6,
                  startY: this.y - 6,
                  ownerEntityId: this.entityId,
                  offsetX,
                  weaponType: this.selectedWeapon,
                  sprayAngle: 0,
                });
                this.game.entities.push(playerWeaponEntity);
              }
              if (config.alternateSide) {
                this.shotSide = this.shotSide === 'left' ? 'right' : 'left';
              }
              this.shootTimer = config.resetShootTimer;

              switch (config.ammoType) {
                case 'infinite':
                  break;
                case 'per-shot':
                  availableWeapon.ammo--;
                  if (availableWeapon.ammo <= 0) {
                    const index = this.availableWeapons.findIndex((a) => a.weapon === this.selectedWeapon);
                    this.selectedWeapon = this.availableWeapons[(index + 1) % this.availableWeapons.length].weapon;
                    this.availableWeapons.splice(this.availableWeapons.indexOf(availableWeapon), 1);
                  }
                  break;
                case 'time':
                  break;
              }
            }
          }
        }
      }
    }

    const ramp = GameRules.player.base.speedRamp;
    if (input.left) {
      this.xInputsThisTick = true;
      this.momentumX -= ramp;
      if (this.momentumX < -GameRules.player.base.maxSideSpeed) {
        this.momentumX = -GameRules.player.base.maxSideSpeed;
      }
    }
    if (input.right) {
      this.xInputsThisTick = true;
      this.momentumX += ramp;
      if (this.momentumX > GameRules.player.base.maxSideSpeed) {
        this.momentumX = GameRules.player.base.maxSideSpeed;
      }
    }
    if (input.up) {
      this.yInputsThisTick = true;
      this.momentumY -= ramp;
      if (this.momentumY < -GameRules.player.base.maxForwardSpeed) {
        this.momentumY = -GameRules.player.base.maxForwardSpeed;
      }
    }
    if (input.down) {
      this.yInputsThisTick = true;
      this.momentumY += ramp;
      if (this.momentumY > GameRules.player.base.maxReverseSpeed) {
        this.momentumY = GameRules.player.base.maxReverseSpeed;
      }
    }
  }

  causedDamage(damage: number, otherEntity: Entity): void {
    this.game.gameLeaderboard?.increaseEntry(this.entityId, 'damageGiven', damage);
  }

  causedKill(otherEntity: Entity): void {
    this.game.gameLeaderboard?.increaseEntry(this.entityId, 'enemiesKilled', 1);
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.y -= collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
      return true;
    }
    if (otherEntity instanceof PlayerEntity) {
      this.momentumX -= collisionResult.overlap * collisionResult.overlap_x;
      this.momentumY -= collisionResult.overlap * collisionResult.overlap_y;
      otherEntity.momentumX += collisionResult.overlap * collisionResult.overlap_x;
      otherEntity.momentumY += collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
      return true;
    }

    if (!this.game.isClient) {
      if (isEnemyWeapon(otherEntity)) {
        otherEntity.hurt(
          otherEntity.damage,
          this,
          collisionResult.overlap * collisionResult.overlap_x,
          collisionResult.overlap * collisionResult.overlap_y
        );
        this.hurt(
          otherEntity.damage,
          otherEntity,
          -collisionResult.overlap * collisionResult.overlap_x,
          -collisionResult.overlap * collisionResult.overlap_y
        );

        return true;
      }
    }
    return false;
  }

  die() {
    this.health = 0;
    this.dead = true;
    if (this.shieldEntityId) this.game.entities.lookup(this.shieldEntityId)?.destroy();
    this.game.explode(this, 'big');
  }

  gameTick(duration: number): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
    this.updatedPositionFromMomentum();
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    const shield = this.game.entities.lookup<PlayerShieldEntity>(this.shieldEntityId!);
    this.bounce(x, y);
    if (!this.game.isClient) {
      this.game.gameLeaderboard?.increaseEntry(this.entityId, 'damageTaken', damage);
    }
    if (shield && !shield.depleted) {
      const damageLeft = shield.hurt(damage, otherEntity, x, y);
      if (damageLeft === 0) {
        return;
      } else {
        damage = damageLeft;
      }
    }

    this.health -= damage;
    this.hit = true;
    if (this.health <= 0) {
      this.die();
    }
  }

  postTick() {
    super.postTick();
    this.hit = false;
    this.game.gameLeaderboard?.increaseEntry(this.entityId, 'aliveTime', GameConstants.serverTickRate);

    for (const availableWeapon of this.availableWeapons) {
      if (WeaponConfigs[availableWeapon.weapon].ammoType === 'time') {
        availableWeapon.ammo -= GameConstants.serverTickRate;
        if (availableWeapon.ammo <= 0) {
          if (availableWeapon.weapon === 'laser2') {
            this.availableWeapons = this.availableWeapons.filter((w) => w.weapon !== 'laser2');
            this.availableWeapons.unshift({weapon: 'laser1', ammo: 0});
            if (this.selectedWeapon === 'laser2') {
              this.selectedWeapon = 'laser1';
            }
          } else {
            const index = this.availableWeapons.findIndex((a) => a.weapon === this.selectedWeapon);
            this.selectedWeapon = this.availableWeapons[(index + 1) % this.availableWeapons.length].weapon;
            this.availableWeapons.splice(this.availableWeapons.indexOf(availableWeapon), 1);
          }
        }
      }
    }
  }

  reconcileFromServer(messageModel: PlayerModel) {
    super.reconcileFromServer(messageModel);
    this.health = messageModel.health;
    this.playerColor = messageModel.playerColor;
    this.lastPlayerInput = messageModel.playerInputKeys;
    this.hit = messageModel.hit;
    this.badges = messageModel.badges;
  }

  reconcileFromServerLive(messageModel: LivePlayerModel) {
    this.x = messageModel.x;
    this.y = messageModel.y;
    this.health = messageModel.health;
    this.hit = messageModel.hit;
    this.dead = messageModel.dead;
    this.playerColor = messageModel.playerColor;
    this.badges = messageModel.badges;
    this.lastProcessedInputSequenceNumber = messageModel.lastProcessedInputSequenceNumber;
    this.momentumX = messageModel.momentumX;
    this.momentumY = messageModel.momentumY;
    this.availableWeapons = messageModel.availableWeapons;
    this.selectedWeapon = messageModel.selectedWeapon;
    this.playersToLeft = messageModel.playersToLeft;
    this.playersToRight = messageModel.playersToRight;
  }

  serialize(): PlayerModel {
    return {
      ...super.serialize(),
      health: this.health,
      playerColor: this.playerColor,
      playerInputKeys: this.lastPlayerInput ?? {down: false, left: false, right: false, shoot: false, up: false},
      badges: this.badges,
      hit: this.hit,
      type: 'player',
    };
  }

  serializeLive(): LivePlayerModel {
    return {
      ...this.serialize(),
      momentumX: this.momentumX,
      momentumY: this.momentumY,
      playersToLeft: this.playersToLeft,
      playersToRight: this.playersToRight,
      lastProcessedInputSequenceNumber: this.lastProcessedInputSequenceNumber,
      dead: this.dead,
      type: 'livePlayer',
      selectedWeapon: this.selectedWeapon,
      availableWeapons: this.availableWeapons.map((w) => ({weapon: w.weapon, ammo: w.ammo})),
    };
  }

  setShieldEntity(shieldEntityId: number) {
    this.shieldEntityId = shieldEntityId;
  }

  updatedPositionFromMomentum() {
    this.x += this.momentumX;
    this.y += this.momentumY;

    const momentumDeceleration = GameRules.player.base.momentumDeceleration;

    if (!this.xInputsThisTick) {
      this.momentumX = this.momentumX * momentumDeceleration;
    }
    if (!this.yInputsThisTick) {
      this.momentumY = this.momentumY * momentumDeceleration;
    }
    if (Math.abs(this.momentumX) < 3) {
      this.momentumX = 0;
    }
    if (Math.abs(this.momentumY) < 3) {
      this.momentumY = 0;
    }

    if (this.y < GameConstants.screenSize.height * 0.1) {
      this.y = GameConstants.screenSize.height * 0.1;
      this.momentumY = 0;
    }
    if (this.y > GameConstants.screenSize.height * 1.1) {
      this.y = GameConstants.screenSize.height * 1.1;
      this.momentumY = 0;
    }
  }

  protected bounce(momentumX: number, momentumY: number) {
    this.momentumX += momentumX;
    this.momentumY += momentumY;
  }

  static randomEnemyColor() {
    return Utils.randomElement(['blue' as const, 'green' as const, 'orange' as const, 'red' as const]);
  }
}

export type PlayerModel = EntityModel & {
  badges: PlayerBadges[];
  health: number;
  hit: boolean;
  playerColor: PlayerColor;
  playerInputKeys: PlayerInputKeys;
  type: 'player';
};

export type LivePlayerModel = EntityModel & {
  availableWeapons: {ammo: number; weapon: PlayerWeapon}[];
  badges: PlayerBadges[];
  dead: boolean;
  health: number;
  hit: boolean;
  lastProcessedInputSequenceNumber: number;
  momentumX: number;
  momentumY: number;
  playerColor: PlayerColor;
  playersToLeft: number;
  playersToRight: number;
  selectedWeapon: PlayerWeapon;
  type: 'livePlayer';
};

export const PlayerBadgesModelSchema: SDArray<SDSimpleObject<PlayerBadges>> = {
  flag: 'array-uint8',
  elements: {
    level: {flag: 'enum', bronze: 1, silver: 3, gold: 3},
    rank: {flag: 'enum', badge: 1, bolt: 2, shield: 3, star: 4},
  },
};

export const LivePlayerModelSchema: SDTypeElement<LivePlayerModel> = {
  ...EntityModelSchema,
  health: 'uint8',
  playerColor: {
    flag: 'enum',
    blue: 1,
    green: 2,
    orange: 3,
    red: 4,
  },
  create: 'boolean',
  hit: 'boolean',
  availableWeapons: {
    flag: 'array-uint8',
    elements: {ammo: 'uint16', weapon: PlayerWeaponEnumSchema},
  },
  badges: PlayerBadgesModelSchema,
  dead: 'boolean',
  lastProcessedInputSequenceNumber: 'uint32',
  momentumX: 'float32',
  momentumY: 'float32',
  playersToLeft: 'uint16',
  playersToRight: 'uint16',
  selectedWeapon: PlayerWeaponEnumSchema,
};

export const PlayerModelSchema: SDTypeElement<PlayerModel> = {
  ...EntityModelSchema,
  health: 'uint8',
  playerColor: {
    flag: 'enum',
    blue: 1,
    green: 2,
    orange: 3,
    red: 4,
  },
  badges: PlayerBadgesModelSchema,
  create: 'boolean',
  hit: 'boolean',
  playerInputKeys: PlayerInputKeyBitmask,
};
