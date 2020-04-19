import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
  GraphQLServiceContext,
} from 'apollo-server-plugin-base';
import {SecureConfig} from 'orbitalgame-server-common/build/config/secureConfig';
import {Config} from 'orbitalgame-server-common/build/config/config';

export class MyApolloPlugin implements ApolloServerPlugin {
  /*  requestDidStart<TContext>(requestContext: GraphQLRequestContext<TContext>): GraphQLRequestListener<TContext> | void {
    return {};
  }*/

  async serverWillStart(service: GraphQLServiceContext) {
    await SecureConfig.setup();
    await Config.setup();
  }
}
