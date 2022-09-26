import type { IncomingHttpHeaders } from 'http';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  EventSourceLambdaIncomingRequest,
  EventSourceResponseParams,
  EventSourceTransformedRequest,
} from '../../event-source';
import { getEventBody, getCommaDelimitedHeaders, getPathWithQueryStringParamsV2 } from './util';

function getRequestValuesFromApiGatewayEvent({
  event,
}: EventSourceLambdaIncomingRequest<APIGatewayProxyEventV2>): EventSourceTransformedRequest {
  const path = getPathWithQueryStringParamsV2(event);
  const headers: IncomingHttpHeaders = getCommaDelimitedHeaders(event.headers);

  let body;

  if (event.cookies) {
    headers['cookie'] = event.cookies.join('; ');
  }

  if (event.body) {
    body = getEventBody(event);
    headers['content-length'] = `${Buffer.byteLength(
      body,
      event.isBase64Encoded ? 'base64' : 'utf8',
    )}`;
  } else {
    body = Buffer.from('', 'utf-8');
  }

  // Pass common api gateway specific metadata as headers
  headers['x-request-id'] = event.requestContext.requestId;
  headers['x-stage'] = event.requestContext.stage;

  return {
    path,
    method: event.requestContext.http.method || 'GET',
    remoteAddress: event.requestContext.http.sourceIp,
    headers,
    body,
  };
}

function getResponseToApiGateway(params: EventSourceResponseParams): APIGatewayProxyResultV2 {
  const headers = params.headers;

  const result: APIGatewayProxyResultV2 = {
    statusCode: params.statusCode,
    body: params.body.toString(),
    isBase64Encoded: params.isBase64Encoded,
  };

  const cookies = params.headers['set-cookie'];
  if (cookies) {
    result.cookies = Array.isArray(cookies)
      ? cookies.map((cookie) => cookie.toString())
      : [cookies.toString()];
    delete headers['set-cookie'];
  }

  result.headers = getCommaDelimitedHeaders(headers);

  return result;
}

export {
  getRequestValuesFromApiGatewayEvent as getRequest,
  getResponseToApiGateway as getResponse,
};
