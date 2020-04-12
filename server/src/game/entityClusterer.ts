import {Entity} from '@common/entities/entity';
import {ArrayHash} from '@common/utils/arrayHash';
import {GameConstants} from '@common/game/gameConstants';
import {Utils} from '@common/utils/utils';
import {EntityModels, EntityType} from '@common/models/entityTypeModels';

type EntityGrouping = {entities: Entity[]; x0: number; x1: number};

export class EntityClusterer {
  constructor(private entities: ArrayHash<Entity>, private idealSize: number) {}

  getGroupings(type: EntityModels['entityType']): EntityGrouping[] {
    const items = this.entities.array.filter((a) => a.entityType === type);
    const screenWidth = GameConstants.screenSize.width;

    if (items.length === 0) {
      return [{entities: [], x0: 0, x1: screenWidth}];
    }

    items.sort((a, b) => a.x - b.x);

    const startScreenX = items[0].x - Utils.mod(items[0].x, screenWidth);
    const endScreenX = items[items.length - 1].x - Utils.mod(items[items.length - 1].x, screenWidth) + screenWidth;

    const groupings: EntityGrouping[] = [];
    for (let x = startScreenX; x <= endScreenX; x += screenWidth) {
      groupings.push({
        entities: [],
        x0: x,
        x1: x + screenWidth,
      });
    }

    for (const item of items) {
      for (const grouping of groupings) {
        if (item.x > grouping.x0 && item.x < grouping.x1) {
          grouping.entities.push(item);
          break;
        }
      }
    }
    groupings.unshift({entities: [], x0: groupings[0].x0 - screenWidth, x1: groupings[0].x0});
    groupings.push({
      entities: [],
      x0: groupings[groupings.length - 1].x1,
      x1: groupings[groupings.length - 1].x1 + screenWidth,
    });

    return groupings;
  }

  getNewEnemyXPosition(): number {
    const padding = 300;
    const groups = Utils.randomizeArray(this.getGroupings('player').filter((a) => a.entities.length < this.idealSize));
    const enemyXs = this.entities.filter((a) => a.entityType === 'swoopingEnemy').map((a) => a.x);
    const enemyMultiple = 2;
    if (groups.length === 0) {
      return 0;
    }
    for (const group of groups) {
      const enemiesInGroup = enemyXs.filter((x) => x > group.x0 && x < group.x1);
      if (Math.max(group.entities.length, this.idealSize) * enemyMultiple > enemiesInGroup.length) {
        const ranges: {x0: number; x1: number}[] = [{x0: group.x0 + padding, x1: 0}];
        for (const entity of enemiesInGroup) {
          ranges[ranges.length - 1].x1 = entity - padding;
          ranges.push({x0: entity + padding, x1: 0});
        }
        ranges[ranges.length - 1].x1 = group.x1 - padding;

        const goodRanges = ranges.filter((r) => r.x0 < r.x1);
        if (goodRanges.length === 0) {
          continue;
        }
        const x = Utils.randomInRanges(goodRanges);
        return x;
      }
    }
    return Utils.randomInRange(groups[0].x0, groups[groups.length - 1].x1);
  }

  getNewPlayerXPosition(): number {
    const padding = 300;
    const groups = this.getGroupings('player');
    while (true) {
      const bestGroup = Utils.randomElement(groups.filter((a) => a.entities.length < this.idealSize));
      const ranges: {x0: number; x1: number}[] = [{x0: bestGroup.x0 + padding, x1: 0}];
      for (const entity of bestGroup.entities) {
        ranges[ranges.length - 1].x1 = entity.x - padding;
        ranges.push({x0: entity.x + padding, x1: 0});
      }
      ranges[ranges.length - 1].x1 = bestGroup.x1 - padding;

      const goodRanges = ranges.filter((r) => r.x0 < r.x1);
      if (goodRanges.length === 0) {
        continue;
      }
      const x = Utils.randomInRanges(goodRanges);
      return x;
    }
  }
}
