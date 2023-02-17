import type { IncomingHttpHeaders } from 'http';
import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  EventSourceLambdaIncomingRequest,
  EventSourceResponseParams,
  EventSourceTransformedRequest,
} from '../../event-source';
import {
  getEventBody,
  getRemoteAddressFromEvent,
  getCommaDelimitedHeaders,
  getMultiValueHeaders,
  sanitizeHeaders,
  getPathWithQueryStringParams,
} from './util';

function getRequestValuesFromApiGatewayEvent({
  event,
}: EventSourceLambdaIncomingRequest<APIGatewayEvent>): EventSourceTransformedRequest {
  let headers: IncomingHttpHeaders = {};

  if (event.multiValueHeaders) {
    headers = getCommaDelimitedHeaders(event.multiValueHeaders);
  } else {
    headers = getCommaDelimitedHeaders(event.headers);
  }

  let body;

  if (event.body) {
    body = getEventBody(event);
    headers['content-length'] = `${Buffer.byteLength(
      body,
      event.isBase64Encoded ? 'base64' : 'utf8',
    )}`;
  } else {
    body = Buffer.from('', 'utf-8');
  }

  // Support override of the authorization token from the authorizer for some legacy apps
  if (
    event.requestContext.authorizer?.authorization &&
    typeof event.requestContext.authorizer?.authorization === 'string' &&
    event.requestContext.authorizer?.authorization !== ''
  ) {
    headers['authorization'] = `Bearer ${event.requestContext.authorizer?.authorization}`;
  }

  // Pass common api gateway specific metadata as headers
  headers['x-request-id'] = event.requestContext.requestId;
  headers['x-stage'] = event.requestContext.stage;

  const remoteAddress = getRemoteAddressFromEvent(event);

  return {
    method: event.httpMethod,
    headers,
    body,
    remoteAddress,
    path: getPathWithQueryStringParams(event),
  };
}

function getResponseToApiGateway(params: EventSourceResponseParams): APIGatewayProxyResult {
  const { headers, statusCode, body, isBase64Encoded } = params;

  const multiValueHeaders = getMultiValueHeaders(headers);

  // chunked transfer not currently supported by API Gateway
  const transferEncodingHeader = multiValueHeaders['transfer-encoding'];
  if (transferEncodingHeader && transferEncodingHeader.includes('chunked')) {
    multiValueHeaders['transfer-encoding'] = transferEncodingHeader.filter(
      (headerValue) => headerValue !== 'chunked',
    );
  }

  return {
    statusCode,
    body: body.toString(),
    headers: sanitizeHeaders(headers),
    multiValueHeaders,
    isBase64Encoded,
  };
}

export {
  getRequestValuesFromApiGatewayEvent as getRequest,
  getResponseToApiGateway as getResponse,
};
