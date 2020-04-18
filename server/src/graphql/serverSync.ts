import {apolloClient} from './apolloClient';
import {SpectateDocument, SpectateQuery} from './schema/generated/graphql';

export class ServerSync {
  static async create() {
    const result = await apolloClient.query<SpectateQuery>({
      query: SpectateDocument,
    });
    console.log(result);
  }
}
