import {Entity} from '@common/entities/entity';
import {ArrayHash} from '@common/utils/arrayHash';
import {GameConstants} from '@common/game/gameConstants';
import {Utils} from '@common/utils/utils';

type EntityGrouping = {entities: Entity[]; x0: number; x1: number};

export class EntityClusterer {
  constructor(private entities: ArrayHash<Entity>, private idealSize: number) {}

  getNewPlayerXPosition(): number {
    const playerPadding = 100;
    const screenWidth = GameConstants.screenSize.width;
    const groupings = this.getGroupings();
    for (const grouping of groupings) {
      if (grouping.entities.length < this.idealSize) {
        const ranges: {x0: number; x1: number}[] = [{x0: grouping.x0, x1: 0}];
        for (const entity of grouping.entities) {
          ranges[ranges.length - 1].x1 = entity.x + playerPadding;
          ranges.push({x0: entity.x - playerPadding, x1: 0});
        }
        ranges[ranges.length - 1].x1 = grouping.x1;

        return Utils.randomInRanges(ranges);
      }
    }
    if (Utils.flipCoin(true, false)) {
      return Utils.randomInRange(groupings[0].x0 - screenWidth, groupings[0].x0);
    } else {
      return Utils.randomInRange(groupings[groupings.length - 1].x1, groupings[groupings.length - 1].x1 + screenWidth);
    }
  }

  private getGroupings(): EntityGrouping[] {
    const items = this.entities.array.filter((a) => a.entityType === 'player');
    const screenWidth = GameConstants.screenSize.width;

    if (items.length === 0) {
      return [{entities: [], x0: -screenWidth / 2, x1: screenWidth / 2}];
    }
    items.sort((a, b) => a.x - b.x);

    const groupings: EntityGrouping[] = [
      {
        entities: [items[0]],
        x0: items[0].x - screenWidth / 2,
        x1: items[0].x + screenWidth / 2,
      },
    ];
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const lastGrouping = groupings[groupings.length - 1];
      if (item.x > lastGrouping.x0 && item.x < lastGrouping.x1) {
        lastGrouping.entities.push(item);
      } else {
        const newGrouping: EntityGrouping = {
          entities: [item],
          x0: item.x - screenWidth / 2,
          x1: item.x + screenWidth / 2,
        };
        if (newGrouping.x0 < lastGrouping.x1) {
          const diff = lastGrouping.x1 - newGrouping.x0;
          newGrouping.x0 += diff;
          newGrouping.x1 += diff;
        }
        groupings.push(newGrouping);
      }
    }

    return groupings;
  }
}
