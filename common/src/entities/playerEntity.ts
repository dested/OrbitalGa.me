import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {GameConstants} from '../game/gameConstants';
import {PlayerWeaponEntity} from './playerWeaponEntity';
import {nextId} from '../utils/uuid';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {WallEntity} from './wallEntity';
import {ExplosionEntity} from './explosionEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {GameRules, PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Utils} from '../utils/utils';
import {isEnemyWeapon, Weapon} from './weapon';
import {unreachable} from '../utils/unreachable';
import {DropType} from './dropEntity';

export type PlayerInput = {
  down: boolean;
  inputSequenceNumber: number;
  left: boolean;
  right: boolean;
  shoot: boolean;
  up: boolean;
  weapon?: PlayerWeapon;
};

export type PlayerColor = 'blue' | 'green' | 'orange' | 'red';
export type AvailableWeapon = {ammo: number; weapon: PlayerWeapon};

export class PlayerEntity extends Entity implements Weapon {
  aliveTick = 0;
  availableWeapons: AvailableWeapon[] = [
    {ammo: 100, weapon: 'laser'},
    {ammo: 5, weapon: 'rocket'},
    {ammo: 3, weapon: 'torpedo'},
  ];
  boundingBoxes = [{width: 99, height: 75}];
  damage = 2;
  dead: boolean = false;
  explosionIntensity = 2;
  health = GameRules.player.base.startingHealth;
  inputSequenceNumber: number = 1;
  isWeapon = true as const;
  lastProcessedInputSequenceNumber: number = 0;
  momentumX = 0;
  momentumY = 0;
  pendingInputs: PlayerInput[] = [];
  selectedWeapon: PlayerWeapon = 'laser';
  shootTimer: number = 1;
  shotSide: 'left' | 'right' = 'left';
  weaponSide = 'player' as const;
  xInputsThisTick: boolean = false;
  yInputsThisTick: boolean = false;

  private shieldEntityId?: number;

  constructor(game: Game, entityId: number, public playerColor: PlayerColor) {
    super(game, entityId, 'player');
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
          this.availableWeapons.push((myWeapon = {weapon: drop.weapon, ammo: 0}));
        }
        switch (drop.weapon) {
          case 'rocket':
            myWeapon.ammo += drop.ammo;
            break;
          case 'laser':
            break;
          case 'torpedo':
            break;
          default:
            unreachable(drop.weapon);
        }
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
    this.xInputsThisTick = false;
    this.yInputsThisTick = false;
    if (input.weapon) {
      this.selectedWeapon = input.weapon;
    }
    if (input.shoot) {
      if (!this.game.isClient) {
        if (this.shootTimer <= 0) {
          const availableWeapon = this.availableWeapons.find((w) => w.weapon === this.selectedWeapon);
          if (availableWeapon && availableWeapon.ammo > 0) {
            const config = WeaponConfigs[this.selectedWeapon];
            let offsetX = 0;
            if (config.alternateSide) {
              offsetX = this.shotSide === 'left' ? -42 : 42;
            }
            const playerWeaponEntity = new PlayerWeaponEntity(
              this.game,
              nextId(),
              this.entityId,
              offsetX,
              this.y - 6,
              this.selectedWeapon
            );
            playerWeaponEntity.start(this.x + offsetX, this.y - 6);
            this.game.entities.push(playerWeaponEntity);
            if (config.alternateSide) {
              this.shotSide = this.shotSide === 'left' ? 'right' : 'left';
            }
            this.shootTimer = config.resetShootTimer;
            if (!config.infinite) {
              availableWeapon.ammo--;
              if (availableWeapon.ammo <= 0) {
                const index = this.availableWeapons.findIndex((a) => a.weapon === this.selectedWeapon);
                this.selectedWeapon = this.availableWeapons[(index + 1) % this.availableWeapons.length].weapon;
                this.availableWeapons.splice(this.availableWeapons.indexOf(availableWeapon), 1);
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
      if (this.momentumX < -GameRules.player.base.maxSpeed) {
        this.momentumX = -GameRules.player.base.maxSpeed;
      }
    }
    if (input.right) {
      this.xInputsThisTick = true;
      this.momentumX += ramp;
      if (this.momentumX > GameRules.player.base.maxSpeed) {
        this.momentumX = GameRules.player.base.maxSpeed;
      }
    }
    if (input.up) {
      this.yInputsThisTick = true;
      this.momentumY -= ramp;
      if (this.momentumY < -GameRules.player.base.maxSpeed) {
        this.momentumY = -GameRules.player.base.maxSpeed;
      }
    }
    if (input.down) {
      this.yInputsThisTick = true;
      this.momentumY += ramp;
      if (this.momentumY > GameRules.player.base.maxSpeed) {
        this.momentumY = GameRules.player.base.maxSpeed;
      }
    }
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
    this.dead = true;
    if (this.shieldEntityId) this.game.entities.lookup(this.shieldEntityId)?.destroy();
    this.game.explode(this, 'big');
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
    if (shield && !shield.depleted) {
      const damageLeft = shield.hurt(damage, otherEntity, x, y);
      if (damageLeft === 0) {
        return;
      } else {
        damage = damageLeft;
      }
    }

    this.health -= damage;
    const explosionEntity = new ExplosionEntity(this.game, nextId(), this.explosionIntensity, this.entityId);
    explosionEntity.start(x, y);
    this.game.entities.push(explosionEntity);
  }

  reconcileFromServer(messageModel: PlayerModel) {
    super.reconcileFromServer(messageModel);
    this.health = messageModel.health;
    this.playerColor = messageModel.playerColor;
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

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerModel | LivePlayerModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addUint8(
      Utils.switchType(entity.playerColor, {
        blue: 1,
        green: 2,
        orange: 3,
        red: 4,
      })
    );
  }
  static addBufferLive(buff: ArrayBufferBuilder, entity: LivePlayerModel) {
    PlayerEntity.addBuffer(buff, entity);
    buff.addFloat32(entity.momentumX);
    buff.addFloat32(entity.momentumY);
    buff.addBoolean(entity.dead);
    buff.addUint32(entity.lastProcessedInputSequenceNumber);
    buff.addUint8(
      Utils.switchType(entity.selectedWeapon, {
        rocket: 1,
        laser: 2,
        torpedo: 3,
      })
    );
    buff.addUint8(entity.availableWeapons.length);
    for (const availableWeapon of entity.availableWeapons) {
      PlayerEntity.addBufferWeapon(buff, availableWeapon.weapon);
      buff.addUint16(availableWeapon.ammo);
    }
  }

  static addBufferWeapon(buff: ArrayBufferBuilder, weapon: PlayerWeapon) {
    buff.addUint8(
      Utils.switchType(weapon, {
        rocket: 1,
        laser: 2,
        torpedo: 3,
      })
    );
  }
  static addBufferWeaponOptional(buff: ArrayBufferBuilder, weapon?: PlayerWeapon) {
    buff.addInt8Optional(
      weapon === undefined
        ? undefined
        : Utils.switchType(weapon, {
            rocket: 1,
            laser: 2,
            torpedo: 3,
          })
    );
  }

  static randomEnemyColor() {
    return Utils.randomElement(['blue' as const, 'green' as const, 'orange' as const, 'red' as const]);
  }

  static readBuffer(reader: ArrayBufferReader): PlayerModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'player',
      health: reader.readUint8(),
      playerColor: Utils.switchNumber(reader.readUint8(), {
        1: 'blue' as const,
        2: 'green' as const,
        3: 'orange' as const,
        4: 'red' as const,
      }),
    };
  }
  static readBufferLive(reader: ArrayBufferReader): LivePlayerModel {
    return {
      ...PlayerEntity.readBuffer(reader),
      entityType: 'livePlayer',
      momentumX: reader.readFloat32(),
      momentumY: reader.readFloat32(),
      dead: reader.readBoolean(),
      lastProcessedInputSequenceNumber: reader.readUint32(),
      selectedWeapon: PlayerEntity.readBufferWeapon(reader),
      availableWeapons: reader.loop(
        () => ({
          weapon: PlayerEntity.readBufferWeapon(reader),
          ammo: reader.readUint16(),
        }),
        '8'
      ),
    };
  }

  static readBufferWeapon(reader: ArrayBufferReader): PlayerWeapon {
    return Utils.switchNumber(reader.readUint8(), {
      1: 'rocket' as const,
      2: 'laser' as const,
      3: 'torpedo' as const,
    });
  }
  static readBufferWeaponOptional(reader: ArrayBufferReader): PlayerWeapon | undefined {
    const weapon = reader.readInt8Optional();
    if (weapon === undefined) {
      return undefined;
    }
    return Utils.switchNumber(weapon, {
      1: 'rocket' as const,
      2: 'laser' as const,
      3: 'torpedo' as const,
    });
  }
}

export type PlayerModel = EntityModel & {
  entityType: 'player';
  health: number;
  playerColor: PlayerColor;
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
