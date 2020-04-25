import {ClassType} from 'type-graphql/dist/interfaces';
import {createUnionType, Field, ObjectType} from 'type-graphql';

@ObjectType()
export class ErrorResponse {
  @Field() error!: string;
}

export function response<T extends ClassType>(V: T) {
  return createUnionType({
    name: V.name + 'Response',
    types: () => [V, ErrorResponse],
    resolveType: (value) => {
      if ('error' in value) {
        return ErrorResponse;
      }
      return V;
    },
  });
}
