import type { Context } from 'aws-lambda';
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { ServerlessResponse } from './response';

import * as gw1 from './event-source/aws/api-gateway-v1';
import * as gw2 from './event-source/aws/api-gateway-v2';
import * as inl from './event-source/aws/legacy-internal-lambda';

// Shape used to explain what we expect from a lambda call request payload.
// - event: entry which differ based on the invoker (api gateway, edge, cognito, internal lambda)
// - context: metadata which contains information about the execution, cognito identity and so on
export interface EventSourceLambdaIncomingRequest<T = any> {
  event: T;
  context: Context;
}

// Generic request shape derived from cross event sources
export interface EventSourceTransformedRequest {
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  body: Buffer;
  remoteAddress: string;
}

export interface EventSourceResponseParams {
  statusCode: number;
  body: Buffer | string;
  headers: OutgoingHttpHeaders;
  isBase64Encoded: boolean;
  response?: ServerlessResponse;
  error?: Error;
}

export enum EventSourceTypes {
  ApiGatewayV1 = 'AWS_API_GATEWAY_V1',
  ApiGatewayV2 = 'AWS_API_GATEWAY_V2',
  LambdaUrl = 'AWS_LAMBDA_URL',
  InternalLambda = 'AWS_INTERNAL_LAMBDA',
}

export interface EventSource {
  getRequest: (payload: EventSourceLambdaIncomingRequest) => EventSourceTransformedRequest;
  getResponse: (response: EventSourceResponseParams) => any;
}

export function guessEventSourceBasedOnEvent(event: any): EventSourceTypes {
  if (event && event.requestContext) {
    return event.version === '2.0' ? EventSourceTypes.ApiGatewayV2 : EventSourceTypes.ApiGatewayV1;
  }
  if (event && event.path && event.request) {
    return EventSourceTypes.InternalLambda;
  }
  throw new Error('Unable to determine event source based on event.');
}

export function getEventSource(eventSourceType: EventSourceTypes): EventSource {
  switch (eventSourceType) {
    case EventSourceTypes.ApiGatewayV1:
      return gw1;
    case EventSourceTypes.ApiGatewayV2:
      return gw2;
    case EventSourceTypes.InternalLambda:
      return inl;
    default:
      throw new Error("Couldn't detect valid event source.");
  }
}
