import {Arg, Ctx, Int, Mutation, Query, Resolver} from 'type-graphql';
import {ServersResponse, ServerStatsResponse} from './models';
import {ServerStatsInput} from './serverInputs';
import {prisma} from '../../server-common';

@Resolver()
export class ServerResolver {
  @Query(() => ServersResponse)
  async servers(): Promise<typeof ServersResponse> {
    return {serverIds: (await prisma.server.findMany({where: {live: true}, select: {id: true}})).map((a) => a.id)};
  }

  @Query(() => ServerStatsResponse)
  async serverStats(
    @Arg('request', () => ServerStatsInput) request: ServerStatsInput
  ): Promise<typeof ServerStatsResponse> {
    const results = await prisma.serverStat.findMany({
      where: {serverId: request.serverId},
      last: 1000,
      orderBy: {createdAt: 'asc'},
    });
    return results;
  }
}
