import 'reflect-metadata';
import {ApolloServer} from 'apollo-server-lambda';
import {MyApolloPlugin} from './gqlUtils/myApolloPlugin';
import {buildSchemaSync} from 'type-graphql';
import {UserResolver} from './resolvers/user/userResolver';
import {LeaderboardResolver} from './resolvers/leaderboard/leaderboardResolver';
import {AuthService} from './server-common';
import {ServerResolver} from './resolvers/server/serverResolver';

const schema = buildSchemaSync({
  resolvers: [UserResolver, LeaderboardResolver, ServerResolver],
  dateScalarMode: 'timestamp',
});

const server = new ApolloServer({
  plugins: [new MyApolloPlugin()],
  schema,
  playground: !!process.env.ISLOCAL,
  introspection: !!process.env.ISLOCAL,
  formatError: (err) => {
    console.error(err);
    return new Error('Internal server error');
  },
  context: ({event, context}) => ({
    jwtPlayer: AuthService.validate(event.headers.authorization || event.headers.Authorization),
    headers: event.headers,
    functionName: context.functionName,
    event,
    context,
  }),
});

exports.graphqlHandler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true,
  },
});
