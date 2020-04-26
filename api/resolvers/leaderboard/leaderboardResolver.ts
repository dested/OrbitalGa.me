import {Query, Resolver, Arg, Int} from 'type-graphql';
import {LeaderboardResponse} from './models';
import * as moment from 'moment';
import {prisma, GlobalLeaderboardEntryWhereInput} from '../../server-common';

@Resolver()
export class LeaderboardResolver {
  @Query(() => [LeaderboardResponse])
  async leaderboard(
    @Arg('serverId', () => Int, {nullable: true}) serverId: number | null
  ): Promise<LeaderboardResponse[]> {
    const where: GlobalLeaderboardEntryWhereInput = {
      createdAt: {
        gt: moment().add(-3, 'days').toDate(),
      },
    };
    if (serverId) {
      where.serverId = serverId;
    }
    const entries = await prisma.globalLeaderboardEntry.findMany({
      where,
      orderBy: {
        score: 'desc',
      },
      first: 30,
      include: {
        user: {
          select: {
            username: true,
            anonymous: true,
          },
        },
      },
    });

    return entries.map((e) => ({
      score: e.score,
      createdAt: e.createdAt,
      ...e,
      username: e.user.username,
      anonymous: e.user.anonymous,
    }));
  }
}
