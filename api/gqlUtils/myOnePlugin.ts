import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
  GraphQLServiceContext,
} from 'apollo-server-plugin-base';

export class MyApolloPlugin implements ApolloServerPlugin {
  /*  requestDidStart<TContext>(requestContext: GraphQLRequestContext<TContext>): GraphQLRequestListener<TContext> | void {
    return {};
  }*/

  async serverWillStart(service: GraphQLServiceContext) {
    // await SecureConfig.setup();
    // await Config.setup();
  }
}
