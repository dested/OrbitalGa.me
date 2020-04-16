import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {GameConstants} from '../game/gameConstants';
import {PlayerWeaponEntity} from './playerWeaponEntity';
import {nextId} from '../utils/uuid';
import {WallEntity} from './wallEntity';
import {ExplosionEntity} from './explosionEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {GameRules, PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Utils} from '../utils/utils';
import {isEnemyWeapon, Weapon} from './weapon';
import {unreachable} from '../utils/unreachable';
import {DropType} from './dropEntity';
import {ImpliedEntityType} from '../models/entityTypeModels';
import {ABSizeByType, ABBitmask, ABEnum} from '../parsers/arrayBufferSchema';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from '../models/enums';
import {EntityModelSchemaType} from '../models/serverToClientMessages';

export type PlayerInputKeys = {
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  up: boolean;
};
export type PlayerInput = PlayerInputKeys & {
  inputSequenceNumber: number;
  weapon?: PlayerWeapon;
};

export type PlayerColor = 'blue' | 'green' | 'orange' | 'red';
export type AvailablePlayerWeapon = {ammo: number; weapon: PlayerWeapon};

export class PlayerEntity extends Entity implements Weapon {
  aliveTick = 0;
  availableWeapons: AvailablePlayerWeapon[] = [
    {ammo: 0, weapon: 'laser1'},
    {ammo: 5, weapon: 'rocket'},
    {ammo: 3, weapon: 'torpedo'},
  ];

  boundingBoxes = [{width: 99, height: 75}];
  damage = 2;
  dead: boolean = false;
  entityType = 'player' as const;
  explosionIntensity = 2;
  health = GameRules.player.base.startingHealth;
  inputSequenceNumber: number = 1;
  isWeapon = true as const;
  lastProcessedInputSequenceNumber: number = 0;
  momentumX = 0;
  momentumY = 0;
  pendingInputs: PlayerInput[] = [];
  playerColor: PlayerColor;
  selectedWeapon: PlayerWeapon = 'laser1';
  shootTimer: number = 1;
  shotSide: 'left' | 'right' = 'left';
  weaponSide = 'player' as const;
  xInputsThisTick: boolean = false;
  yInputsThisTick: boolean = false;
  protected lastPlayerInput?: PlayerInputKeys;
  private shieldEntityId?: number;

  constructor(game: Game, messageModel: ImpliedEntityType<Omit<PlayerModel, 'playerInputKeys'>>) {
    super(game, messageModel);
    this.health = messageModel.health;
    this.playerColor = messageModel.playerColor;
    this.createPolygon();
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

  applyInput(input: PlayerInput) {
    this.aliveTick++;
    this.lastPlayerInput = input;
    this.xInputsThisTick = false;
    this.yInputsThisTick = false;
    if (input.weapon) {
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
              this.game.gameLeaderboard.increaseEntry(this.entityId, 'shotsFired', 1);
              let offsetX = 0;
              if (config.alternateSide) {
                offsetX = this.shotSide === 'left' ? -42 : 42;
              }
              const playerWeaponEntity = new PlayerWeaponEntity(this.game, {
                entityId: nextId(),
                x: this.x + offsetX,
                y: this.y - 6,
                ownerEntityId: this.entityId,
                offsetX,
                startY: this.y - 6,
                weaponType: this.selectedWeapon,
              });
              this.game.entities.push(playerWeaponEntity);
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

    const ramp = 30;
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
    this.game.gameLeaderboard.increaseEntry(this.entityId, 'damageGiven', damage);
  }

  causedKill(otherEntity: Entity): void {
    this.game.gameLeaderboard.increaseEntry(this.entityId, 'enemiesKilled', 1);
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.y -= collisionResult.overlap * collisionResult.overlap_y;
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
    this.game.gameLeaderboard.removePlayer(this.entityId);
  }

  gameTick(): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
    this.updatedPositionFromMomentum();

    if (!this.game.isClient) {
      if (this.health <= 0) {
        this.die();
      }
    }
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    const shield = this.game.entities.lookup<PlayerShieldEntity>(this.shieldEntityId!);
    this.momentumX += x;
    this.momentumY += y;
    if (!this.game.isClient) {
      this.game.gameLeaderboard.increaseEntry(this.entityId, 'damageTaken', damage);
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
    const explosionEntity = new ExplosionEntity(this.game, {
      entityId: nextId(),
      x,
      y,
      intensity: this.explosionIntensity,
      ownerEntityId: this.entityId,
    });
    this.game.entities.push(explosionEntity);
  }

  postTick() {
    super.postTick();
    this.game.gameLeaderboard.increaseEntry(this.entityId, 'aliveTime', GameConstants.serverTickRate);

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
  }

  reconcileFromServerLive(messageModel: LivePlayerModel) {
    this.x = messageModel.x;
    this.y = messageModel.y;
    this.health = messageModel.health;
    this.dead = messageModel.dead;
    this.playerColor = messageModel.playerColor;
    this.lastProcessedInputSequenceNumber = messageModel.lastProcessedInputSequenceNumber;
    this.momentumX = messageModel.momentumX;
    this.momentumY = messageModel.momentumY;
    this.availableWeapons = messageModel.availableWeapons;
    this.selectedWeapon = messageModel.selectedWeapon;
  }

  serialize(): PlayerModel {
    return {
      ...super.serialize(),
      health: this.health,
      playerColor: this.playerColor,
      playerInputKeys: this.lastPlayerInput ?? {down: false, left: false, right: false, shoot: false, up: false},
      entityType: 'player',
    };
  }

  serializeLive(): LivePlayerModel {
    return {
      ...this.serialize(),
      momentumX: this.momentumX,
      momentumY: this.momentumY,
      lastProcessedInputSequenceNumber: this.lastProcessedInputSequenceNumber,
      dead: this.dead,
      entityType: 'livePlayer',
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

  static randomEnemyColor() {
    return Utils.randomElement(['blue' as const, 'green' as const, 'orange' as const, 'red' as const]);
  }
}

export type PlayerModel = EntityModel & {
  entityType: 'player';
  health: number;
  playerColor: PlayerColor;
  playerInputKeys: PlayerInputKeys;
};

export type LivePlayerModel = EntityModel & {
  availableWeapons: {ammo: number; weapon: PlayerWeapon}[];
  dead: boolean;
  entityType: 'livePlayer';
  health: number;
  lastProcessedInputSequenceNumber: number;
  momentumX: number;
  momentumY: number;
  playerColor: PlayerColor;
  selectedWeapon: PlayerWeapon;
};

export const LivePlayerModelSchema: EntityModelSchemaType<'livePlayer'> = {
  ...EntityModelSchema,
  health: 'uint8',
  playerColor: {
    enum: true,
    blue: 1,
    green: 2,
    orange: 3,
    red: 4,
  },
  create: 'boolean',
  availableWeapons: {
    arraySize: 'uint8',
    ammo: 'uint16',
    weapon: PlayerWeaponEnumSchema,
  },
  dead: 'boolean',
  lastProcessedInputSequenceNumber: 'uint32',
  momentumX: 'float32',
  momentumY: 'float32',
  selectedWeapon: PlayerWeaponEnumSchema,
};

export const PlayerModelSchema: EntityModelSchemaType<'player'> = {
  ...EntityModelSchema,
  health: 'uint8',
  playerColor: {
    enum: true,
    blue: 1,
    green: 2,
    orange: 3,
    red: 4,
  },
  create: 'boolean',
  playerInputKeys: PlayerInputKeyBitmask,
};
