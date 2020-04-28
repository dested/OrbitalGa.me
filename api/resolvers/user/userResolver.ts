import {Arg, Ctx, Int, Mutation, Query, Resolver} from 'type-graphql';
import {GameModel, LoginResponse, SpectateResponse} from './models';
import * as bcrypt from 'bcryptjs';
import {Utils} from '@common/utils/utils';
import {LoginAnonymousInput, LoginInput} from './userInputs';
import {OrbitalContext} from '../../gqlUtils/orbitalContext';
import {AuthService, prisma, User} from '../../server-common';

@Resolver()
export class UserResolver {
  @Mutation(() => LoginResponse)
  async login(
    @Arg('request', () => LoginInput) request: LoginInput,
    @Ctx() context: OrbitalContext
  ): Promise<typeof LoginResponse> {
    const user = await prisma.user.findOne({where: {username: request.userName}});
    if (user) {
      if (!(user.passwordHash && (await bcrypt.compare(request.password, user.passwordHash)))) {
        await Utils.timeout(5000);
        return {
          error: 'User not found',
        };
      }
      return await userReady(user);
    } else {
      return {
        error: 'User not found',
      };
    }
  }

  @Mutation(() => LoginResponse)
  async loginAnonymous(
    @Arg('request', () => LoginAnonymousInput) request: LoginAnonymousInput,
    @Ctx() context: OrbitalContext
  ): Promise<typeof LoginResponse> {
    let user = await prisma.user.findOne({where: {username: request.userName}});
    if (user && !user.anonymous) {
      return {
        error: 'This username is registered',
      };
    }
    if (user) {
      if (!context.jwtPlayer || context.jwtPlayer.userId !== user.id) {
        await prisma.user.delete({where: {id: user.id}});
        user = null;
      }
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          anonymous: true,
          username: request.userName,
        },
      });
    }
    return await userReady(user);
  }

  @Mutation(() => LoginResponse)
  async register(
    @Arg('request', () => LoginInput) request: LoginInput,
    @Ctx() context: OrbitalContext
  ): Promise<typeof LoginResponse> {
    if (context.jwtPlayer) {
      const foundUser = await prisma.user.findOne({where: {id: context.jwtPlayer.userId}});
      if (foundUser) {
        if (!foundUser.anonymous) {
          return {
            error: 'This is not an anonymous user',
          };
        }
        await prisma.user.update({
          where: {id: context.jwtPlayer.userId},
          data: {
            anonymous: false,
            passwordHash: await bcrypt.hash(request.password, await bcrypt.genSalt(10)),
          },
        });
        return await userReady(foundUser);
      }
    }
    let user = await prisma.user.findOne({where: {username: request.userName}});
    if (user) {
      return {
        error: 'This username is registered',
      };
    }
    user = await prisma.user.create({
      data: {
        anonymous: false,
        passwordHash: await bcrypt.hash(request.password, await bcrypt.genSalt(10)),
        username: request.userName,
      },
    });
    return await userReady(user);
  }

  @Query(() => SpectateResponse)
  async spectateServer(): Promise<SpectateResponse> {
    return {
      spectateJwt: await AuthService.createSpectateToken(),
      gameModel: await getNextGameServer(),
    };
  }
}

const getNextGameServer = async (): Promise<GameModel | null> => {
  const latestServer = await prisma.server.findMany({where: {live: true}, orderBy: {updatedAt: 'desc'}, first: 5});
  console.log('next game server', latestServer.length);
  for (const latestServerElement of latestServer) {
    if (+latestServerElement.updatedAt + 15_000 < +new Date()) {
      await prisma.server.update({where: {id: latestServerElement.id}, data: {live: false}});
    } else {
      return {
        serverId: latestServerElement.id,
        serverUrl: latestServerElement.serverUrl,
      };
    }
  }
  return null;
};
async function userReady(user: User) {
  const game = await getNextGameServer();
  const jwt = await AuthService.createToken({
    userId: user.id,
    isAnonymous: user.anonymous,
    userName: user.username,
  });
  return {
    jwt,
    gameModel: game,
  };
}
