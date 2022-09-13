import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

export const v2EventBase: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: 'POST /v1/products',
  rawPath: '/v1/products',
  rawQueryString: 'a=1&a=2&b=true&sort[by]=name&sort[order]=desc',
  cookies: ['Cookie_3=johnnytsunami', 'Cookie_4=value'],
  headers: {
    accept: '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'cache-control': 'no-cache',
    'content-length': '80',
    'content-type': 'application/json',
    host: 'some-domain.execute-api.eu-west-1.amazonaws.com',
    'user-agent': 'PostmanRuntime/7.29.2',
    'x-amzn-trace-id': 'Root=1-631d110e-xxxxx',
    'x-forwarded-for': '168.114.34.212',
    'x-forwarded-port': '443',
    'x-forwarded-proto': 'https',
  },
  queryStringParameters: { a: '1,2', b: 'true', 'sort[by]': 'name', 'sort[order]': 'desc' },
  requestContext: {
    accountId: '221336448553',
    apiId: '10krrmvc4l',
    domainName: 'some-domain.execute-api.eu-west-1.amazonaws.com',
    domainPrefix: '9ak86mvc4l',
    http: {
      method: 'POST',
      path: '/v1/products',
      protocol: 'HTTP/1.1',
      sourceIp: '168.114.34.212',
      userAgent: 'PostmanRuntime/7.29.2',
    },
    requestId: 'YQ-aRhPgDoEEPYg=',
    routeKey: 'ANY /v1/products',
    stage: '$default',
    time: '10/Sep/2010:16:34:54 +0000',
    timeEpoch: 1662849294355,
  },
  body:
    '{\n' +
    '    "productName": "My special product",\n' +
    '    "norms": ["general", "student"]\n' +
    '}',
  isBase64Encoded: false,
};

export const defaultContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: '',
  functionVersion: '',
  invokedFunctionArn: '',
  memoryLimitInMB: '256',
  awsRequestId: '',
  logGroupName: '',
  logStreamName: '',
  getRemainingTimeInMillis: () => 1,
  done(error?: Error, result?: any): void {},
  fail(error: Error | string): void {},
  succeed(messageOrObject: any): void {},
};

export function makeV2Event(
  cb: (event: APIGatewayProxyEventV2) => APIGatewayProxyEventV2,
): APIGatewayProxyEventV2 {
  return cb(JSON.parse(JSON.stringify(v2EventBase)));
}
