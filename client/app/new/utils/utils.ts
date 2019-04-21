import {GameEntity, ISolidEntity} from '../base/entity';

export class Utils {
  static generateId(): string {
    return (Math.random() * 100000).toFixed(0);
  }

  static isSolidEntity(otherEntity: any): otherEntity is ISolidEntity {
    return (otherEntity as any).solid;
  }

  static round(value: number, decimals: number) {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  }
}
