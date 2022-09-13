import { inspect } from 'util';
import { RequestListener } from 'http';

import { ServerlessRequest } from './request';
import { ServerlessResponse, getBodyBuffer } from './response';
import { EventSourceTransformedRequest } from './event-source';
import { isBinary } from './binary';
import { Logger } from './logger';

interface RequestResponsePair {
  request: ServerlessRequest;
  response: ServerlessResponse;
}

export async function getRequestResponse(
  transformedRequest: EventSourceTransformedRequest,
): Promise<RequestResponsePair> {
  const request = new ServerlessRequest({
    method: transformedRequest.method,
    headers: transformedRequest.headers,
    body: transformedRequest.body,
    remoteAddress: transformedRequest.remoteAddress,
    url: transformedRequest.path,
  });
  await waitForStreamComplete(request);
  const response = new ServerlessResponse(request);
  return { request, response };
}

interface ForwardResponseProps {
  response: ServerlessResponse;
  eventSource: any; //EventSource;
  logger: Logger;
}

export async function forwardResponse({
  response,
  eventSource,
  logger,
}: ForwardResponseProps): Promise<any> {
  const statusCode = response.statusCode;
  const headers = response.getHeaders();
  const isBase64Encoded = isBinary(headers);
  const encoding = isBase64Encoded ? 'base64' : 'utf8';
  const body = response.getBodyBuffer().toString(encoding);
  const logBody = isBase64Encoded ? '[BASE64_ENCODED]' : body;

  logger.debug('forwardResponse:eventSourceResponseParams', {
    statusCode,
    body: logBody,
    headers,
    isBase64Encoded,
  });

  const successResponse = eventSource.getResponse({
    statusCode,
    body,
    headers,
    isBase64Encoded,
    response,
  });

  logger.debug('forwardResponse:eventSourceResponse', {
    successResponse: inspect(successResponse, { depth: null }),
    body: logBody,
  });

  return successResponse;
}

interface ForwardRequestProps {
  app: RequestListener;
  event: any;
  context: any; //Context;
  eventSource: any; // EventSource;
  logger: Logger;
}

export async function forwardRequestToNodeServer({
  app,
  event,
  context,
  eventSource,
  logger,
}: ForwardRequestProps): Promise<any> {
  const genericLambdaRequest = eventSource.getRequest({ event, context });

  logger.debug('forwardRequestToNodeServer:requestValues', {
    requestValues: genericLambdaRequest,
  });

  const { request, response } = await getRequestResponse(genericLambdaRequest);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.handle(request, response);

  await waitForStreamComplete(response);

  logger.debug('forwardRequestToNodeServer:response', { response });

  return forwardResponse({
    response,
    eventSource,
    logger,
  });
}

interface RespondToEventSourceWithErrorProps {
  error: Error;
  eventSource: any;
  logger: Logger;
}

export function respondToEventSourceWithError({
  error,
  eventSource,
  logger,
}: RespondToEventSourceWithErrorProps): any {
  logger.info('respondToEventSourceWithError', { error });
  const body = Buffer.from(String(error.stack), 'utf-8');
  return eventSource.getResponse({
    statusCode: 500,
    body,
    headers: {},
    isBase64Encoded: false,
    error,
  });
}

async function waitForStreamComplete(stream: any): Promise<any> {
  if (stream.complete || stream.finished || stream.writableEnded) {
    return stream;
  }

  return new Promise((resolve, reject) => {
    let isComplete = false;

    function complete(err: Error): void {
      if (isComplete) {
        return;
      }

      isComplete = true;

      stream.removeListener('error', complete);
      stream.removeListener('end', complete);
      stream.removeListener('finish', complete);

      if (err) {
        reject(err);
      } else {
        resolve(stream);
      }
    }

    stream.once('error', complete);
    stream.once('end', complete);
    stream.once('finish', complete);
  });
}
