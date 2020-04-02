import {RequestError} from './errors';

export interface RequestHeaders {
  authorization?: string;
}
export interface LambdaRequestEvent<T> {
  queryStringParameters: T;
  pathParameters: T;
  body: T;
  params: T;
  headers: RequestHeaders;
  httpMethod: string;
  path: string;
}

export function handlerWrapper<TRequest, TResponse>(
  request: (model: TRequest, headers: RequestHeaders) => Promise<TResponse>
) {
  return async (event: LambdaRequestEvent<TRequest>) => {
    if (event.body && (event.body as any).indexOf('<') === 0) {
      // xml
      event.params = {...event.queryStringParameters, ...event.pathParameters};
    } else {
      event.body = event.body && (event.body as any).indexOf('<') !== 0 ? JSON.parse(event.body as any) : event.body;
      event.params = {...event.body, ...event.queryStringParameters, ...event.pathParameters};
    }

    try {
      // await SecureConfig.setup();
      // await Config.setup();
      console.log('starting request', event.path);
      // await getDBInstance();
      console.log('got db instance');
      const response = await request(event.params, event.headers);
      console.log('finished request');

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(response),
      };
    } catch (ex) {
      console.log('request error');
      console.error(ex);

      if (ex instanceof RequestError) {
        return {
          statusCode: ex.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: ex.message,
        };
      } else {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: 'An unexpected server error has occurred.',
        };
      }
    }
  };
}
