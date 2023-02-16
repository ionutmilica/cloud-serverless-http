import {
  EventSourceLambdaIncomingRequest,
  EventSourceResponseParams,
  EventSourceTransformedRequest,
} from '../../event-source';
import { OutgoingHttpHeaders } from 'http';

export type TKeyValueParams = { [key: string]: any };
export type TReqParams = { [key: string]: any };
export type RequestHeaders = { [key: string]: string | string[] };

export type InternalError = {
  errorCode: string;
  errorDescription: string;
};

export interface InternalRequest<T = TReqParams> {
  headers?: RequestHeaders;
  params: T;
}

export interface InternalResponse<T = any> {
  statusCode?: number;
  headers?: RequestHeaders;
  data?: T;
  error?: InternalError;
}

export interface LambdaCall<T = TKeyValueParams> {
  path: string;
  request: InternalRequest<T>;
}

const contentTypeHeader = 'content-type';
const contentLengthHeader = 'content-length';

export function getEventBody(event: LambdaCall<unknown>): Buffer {
  return Buffer.from(JSON.stringify(event.request.params), 'utf-8');
}

export function sanitiseHeaders(headers: OutgoingHttpHeaders): RequestHeaders {
  const sanitizedHeaders: RequestHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'number') {
      sanitizedHeaders[key] = String(value);
    } else if (value !== null && typeof value !== 'undefined' && !Array.isArray(value)) {
      sanitizedHeaders[key] = value;
    }
  }
  return sanitizedHeaders;
}

function mapEventToHttpRequest(
  request: EventSourceLambdaIncomingRequest<LambdaCall>,
): EventSourceTransformedRequest {
  const body = getEventBody(request.event);
  const path = request.event.path;

  const headers = {
    [contentTypeHeader]: 'application/json',
    [contentLengthHeader]: Buffer.byteLength(body, 'utf-8').toString(),
  };

  return {
    method: 'POST',
    remoteAddress: '',
    path,
    body,
    headers,
  };
}

function getResponseToInternalLambda(params: EventSourceResponseParams): InternalResponse {
  const { headers, statusCode, body, error } = params;

  const contentTypeValue = headers[contentTypeHeader];

  if (contentTypeValue && !String(headers[contentTypeHeader]).includes('json')) {
    if (statusCode === 404) {
      throw new Error('This route is not registered');
    } else {
      throw new Error('Invalid response content type received');
    }
  }

  // Something went wrong at the library level (route not found, other crashes..)
  if (error) {
    return {
      statusCode: 500,
      error: {
        errorCode: 'LIBRARY_ERROR',
        errorDescription: `Library failure: ${error.toString()}`,
      },
      headers: {},
    };
  }

  const payload = JSON.parse(body.toString());
  let successResponse;

  const sanitisedHeaders = sanitiseHeaders(headers);

  if (statusCode >= 200 && params.statusCode <= 299) {
    successResponse = { statusCode, data: payload, headers: sanitisedHeaders };
  } else {
    successResponse = { statusCode, error: payload, headers: sanitisedHeaders };
  }

  return successResponse;
}

export { getResponseToInternalLambda as getResponse, mapEventToHttpRequest as getRequest };
