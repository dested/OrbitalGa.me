import {Utils} from '@common/utils/utils';
import {AuthService} from '../server-common/src/auth/authService';
import * as bcrypt from 'bcryptjs';
import {ApolloServer} from 'apollo-server-lambda';
import {GameModel, Resolvers} from './schema/generated/graphql';
import {MyApolloPlugin} from './gqlUtils/myOnePlugin';
import * as CommonTypeDefs from './schema/common.graphql';
import * as UserTypeDefs from './schema/user.graphql';
import * as UserInputTypeDefs from './schema/user.input.graphql';
import {DateScalar} from './gqlUtils/dateScalar';
import {prisma, User} from 'orbitalgame-server-common/build/index';

const getNextGameServer = async (): Promise<GameModel | null> => {
  const latestServer = await prisma.server.findMany({where: {live: true}, orderBy: {updatedAt: 'desc'}, first: 5});
  console.log('next game server', latestServer.length);
  for (const latestServerElement of latestServer) {
    if (+latestServerElement.updatedAt + 15_000 < +new Date()) {
      await prisma.server.update({where: {id: latestServerElement.id}, data: {live: false}});
    } else {
      return {
        serverId: latestServer[0].id,
        serverUrl: latestServer[0].serverUrl,
      };
    }
  }
  return null;
};

async function userReady(user: User) {
  const game = await getNextGameServer();
  const jwt = await AuthService.createToken({
    userId: user.id,
  });
  return {
    jwt,
    gameModel: game,
  };
}

const resolvers: Resolvers = {
  Query: {
    placeholder: () => true,
    spectateServer: () => {
      return getNextGameServer();
    },
  },
  Mutation: {
    placeholder: () => true,
    login: async (_, {request}) => {
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
    },
    register: async (_, {request}, context) => {
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
    },
    loginAnonymous: async (_, {request}, {jwtPlayer}) => {
      let user = await prisma.user.findOne({where: {username: request.userName}});
      if (user && !user.anonymous) {
        return {
          error: 'This username is registered',
        };
      }
      if (user) {
        if (!jwtPlayer || jwtPlayer.userId !== user.id) {
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
    },
  },
  LoginResponse: {
    __resolveType: (parent, args, context) => {
      return 'error' in parent ? 'ErrorResponse' : 'LoginSuccessResponse';
    },
  },
  Date: DateScalar,
};

const server = new ApolloServer({
  plugins: [new MyApolloPlugin()],
  typeDefs: [CommonTypeDefs as any, UserTypeDefs as any, UserInputTypeDefs as any],
  resolvers,
  playground: process.env.ISLOCAL ? true : false,
  introspection: process.env.ISLOCAL ? true : false,
  context: ({event, context}) => ({
    jwtPlayer: AuthService.validate(event.headers.authorization || event.headers.Authorization),
    headers: event.headers,
    functionName: context.functionName,
    event,
    context,
  }),
});

exports.graphqlHandler = server.createHandler();
