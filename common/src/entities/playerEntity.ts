import {Result} from 'collisions';
import {OrbitalGame} from '../game/game';
import {Entity} from '../baseEntities/entity';
import {GameConstants} from '../game/gameConstants';
import {PlayerWeaponEntity} from './playerWeaponEntity';
import {nextId} from '../utils/uuid';
import {WallEntity} from './wallEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {GameRules, PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Utils} from '../utils/utils';
import {isEnemyWeapon, WeaponEntity, isWeapon, isNeutralWeapon} from './weaponEntity';
import {unreachable} from '../utils/unreachable';
import {DropType} from './dropEntity';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from '../models/schemaEnums';
import {SDArray, SDSimpleObject, SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';
import {CTOSPlayerInput} from '../models/clientToServerMessages';
import {TwoVector} from '../utils/twoVector';

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

export class PlayerEntity extends PhysicsEntity implements WeaponEntity {
  availableWeapons: AvailablePlayerWeapon[] = [
    {ammo: 0, weapon: 'laser1'},
    {ammo: 5, weapon: 'rocket'},
    {ammo: 3, weapon: 'torpedo'},
  ];
  badges!: PlayerBadges[];
  boundingBoxes = [{width: 99, height: 75}];
  damage = 2;
  dead: boolean = false;
  explosionIntensity = 2;
  health = GameRules.player.base.startingHealth;
  hit = false;
  isWeapon = true as const;
  ownerPlayerEntityId!: number;
  playerColor!: PlayerColor;
  playerInputKeys?: PlayerInputKeys;
  selectedWeapon: PlayerWeapon = 'laser1';
  shootTimer: number = 10;
  shotSide: 'left' | 'right' = 'left';
  staticPlayersToLeft?: number;
  staticPlayersToRight?: number;
  type: 'player' | 'livePlayer';
  weaponSide = 'player' as const;
  private shieldEntityId?: number;

  constructor(public game: OrbitalGame, messageModel: ImpliedDefaultPhysics<PlayerModel | LivePlayerModel>) {
    super(game, messageModel);
    this.type = messageModel.type;
    messageModel.friction = new TwoVector(0.9, 0.9);
    this.reconcileFromServer(messageModel as Required<PlayerModel | LivePlayerModel>);
    this.createPolygon();
  }

  get canShoot() {
    return this.shootTimer <= 0;
  }

  get playersToLeft() {
    if (this.staticPlayersToLeft !== undefined) return this.staticPlayersToLeft;
    return this.game.entities.filter(
      (e) =>
        e.type === 'player' &&
        e instanceof PhysicsEntity &&
        e.position.x < this.position.x - GameConstants.screenSize.width / 2
    ).length;
  }

  set playersToLeft(value: number) {
    this.staticPlayersToLeft = value;
  }

  get playersToRight() {
    if (this.staticPlayersToRight !== undefined) return this.staticPlayersToRight;
    return this.game.entities.filter(
      (e) =>
        e.type === 'player' &&
        e instanceof PhysicsEntity &&
        e.position.x > this.position.x + GameConstants.screenSize.width / 2
    ).length;
  }

  set playersToRight(value: number) {
    this.staticPlayersToRight = value;
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
            shield.depleted = false;
          } else {
            shield.health = GameRules.playerShield[drop.level].maxHealth;
            shield.shieldStrength = drop.level;
            shield.depleted = false;
          }
        }
        break;
      default:
        unreachable(drop);
    }
  }

  applyInput(input: CTOSPlayerInput) {
    if (input.weapon !== 'unset') {
      this.selectedWeapon = input.weapon;
    }
    if (input.keys.shoot) {
      const config = WeaponConfigs[this.selectedWeapon];
      if (this.canShoot) {
        const availableWeapon = this.availableWeapons.find((w) => w.weapon === this.selectedWeapon);
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
                  inputId: input.messageIndex,
                  position: {x: this.position.x + offsetX, y: this.position.y - 6},
                  ownerEntityId: this.entityId,
                  weaponType: this.selectedWeapon,
                  sprayAngle: Math.round(i * (180 / config.spray)),
                });
                this.game.addObjectToWorld(playerWeaponEntity);
              }
            } else {
              const playerWeaponEntity = new PlayerWeaponEntity(this.game, {
                entityId: nextId(),
                inputId: input.messageIndex,
                position: {x: this.position.x + offsetX, y: this.position.y - 6},
                ownerEntityId: this.entityId,
                weaponType: this.selectedWeapon,
                sprayAngle: 0,
              });
              this.game.addObjectToWorld(playerWeaponEntity);
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

    const ramp = GameRules.player.base.speedRamp;
    if (input.keys.left) {
      this.velocity.add({x: -ramp, y: 0});
    }
    if (input.keys.right) {
      this.velocity.add({x: ramp, y: 0});
    }
    if (input.keys.up) {
      this.velocity.add({x: 0, y: -ramp});
    }
    if (input.keys.down) {
      this.velocity.add({x: 0, y: ramp});
    }
  }

  causedDamage(damage: number, otherEntity: Entity): void {
    this.game.gameLeaderboard?.increaseEntry(this.entityId, 'damageGiven', damage);
  }

  causedKill(otherEntity: Entity): void {
    this.game.gameLeaderboard?.increaseEntry(this.entityId, 'enemiesKilled', 1);
  }

  collide(otherEntity: PhysicsEntity, collisionResult: Result): void {
    if (isEnemyWeapon(otherEntity) || isNeutralWeapon(otherEntity)) {
      this.hurt(otherEntity.damage);
    }
  }

  die() {
    this.health = 0;
    this.dead = true;
    if (this.shieldEntityId) this.game.entities.lookup(this.shieldEntityId)?.destroy();
    this.game.explode(this, 'big');
  }

  gameTick(duration: number): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
    if (this.position.y < GameConstants.screenSize.height * 0.1) {
      this.position.y = GameConstants.screenSize.height * 0.1;
      this.velocity.set(this.velocity.x, 0);
    }
    if (this.position.y > GameConstants.screenSize.height * 1.1) {
      this.position.y = GameConstants.screenSize.height * 1.1;
      this.velocity.set(this.velocity.x, 0);
    }
  }

  hurt(damage: number) {
    if (!this.game.isClient) {
      const shield = this.game.entities.lookup<PlayerShieldEntity>(this.shieldEntityId!);
      this.game.gameLeaderboard?.increaseEntry(this.entityId, 'damageTaken', damage);
      if (shield && !shield.depleted) {
        const damageLeft = shield.hurt(damage);
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

  reconcileFromServer(messageModel: PlayerModel | LivePlayerModel) {
    super.reconcileFromServer(messageModel);
    this.health = messageModel.health;
    this.playerColor = messageModel.playerColor;
    this.hit = messageModel.hit;
    this.badges = messageModel.badges;
    if (messageModel.type === 'player') {
      this.playerInputKeys = messageModel.playerInputKeys;
    } else {
      this.dead = messageModel.dead;
      this.availableWeapons = messageModel.availableWeapons;
      this.selectedWeapon = messageModel.selectedWeapon;
      this.playersToLeft = messageModel.playersToLeft;
      this.playersToRight = messageModel.playersToRight;
    }
  }

  serialize(): PlayerModel {
    return {
      ...super.serialize(),
      health: this.health,
      playerColor: this.playerColor,
      playerInputKeys: this.playerInputKeys ?? {down: false, left: false, right: false, shoot: false, up: false},
      badges: this.badges,
      hit: this.hit,
      type: 'player',
    };
  }

  serializeLive(): LivePlayerModel {
    return {
      ...this.serialize(),
      playersToLeft: this.playersToLeft,
      playersToRight: this.playersToRight,
      dead: this.dead,
      type: 'livePlayer',
      selectedWeapon: this.selectedWeapon,
      availableWeapons: this.availableWeapons.map((w) => ({weapon: w.weapon, ammo: w.ammo})),
    };
  }

  setShieldEntity(shieldEntityId: number) {
    this.shieldEntityId = shieldEntityId;
  }

  static randomEnemyColor() {
    return Utils.randomElement(['blue' as const, 'green' as const, 'orange' as const, 'red' as const]);
  }
}

export type PlayerModel = PhysicsEntityModel & {
  badges: PlayerBadges[];
  health: number;
  hit: boolean;
  playerColor: PlayerColor;
  playerInputKeys: PlayerInputKeys;
  type: 'player';
};

export type LivePlayerModel = PhysicsEntityModel & {
  availableWeapons: {ammo: number; weapon: PlayerWeapon}[];
  badges: PlayerBadges[];
  dead: boolean;
  health: number;
  hit: boolean;
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
  ...PhysicsEntityModelSchema,
  health: 'uint8',
  playerColor: {
    flag: 'enum',
    blue: 1,
    green: 2,
    orange: 3,
    red: 4,
  },
  hit: 'boolean',
  availableWeapons: {
    flag: 'array-uint8',
    elements: {ammo: 'uint16', weapon: PlayerWeaponEnumSchema},
  },
  badges: PlayerBadgesModelSchema,
  dead: 'boolean',
  playersToLeft: 'uint16',
  playersToRight: 'uint16',
  selectedWeapon: PlayerWeaponEnumSchema,
};

export const PlayerModelSchema: SDTypeElement<PlayerModel> = {
  ...PhysicsEntityModelSchema,
  health: 'uint8',
  playerColor: {
    flag: 'enum',
    blue: 1,
    green: 2,
    orange: 3,
    red: 4,
  },
  badges: PlayerBadgesModelSchema,
  hit: 'boolean',
  playerInputKeys: PlayerInputKeyBitmask,
};
