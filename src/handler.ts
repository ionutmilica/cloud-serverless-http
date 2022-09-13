import type { RequestListener } from 'http';
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2, Context, Callback } from 'aws-lambda';
import { inspect } from 'util';
import { forwardRequestToNodeServer, respondToEventSourceWithError } from './transport';
import { getEventSource, guessEventSourceBasedOnEvent } from './event-source';
import { Logger, makeLogger } from './logger';

export type HandlerConfiguration = {
  app: RequestListener;
  logger?: Logger;
  logLevel?: 'error' | 'info' | 'debug';
};

export function createHandler({
  app,
  logLevel = 'error',
  logger = makeLogger(logLevel),
}: HandlerConfiguration) {
  return async function handler(
    event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
    context: Context,
    callback: Callback,
  ) {
    logger.debug('handler.incomingRequest', {
      event: inspect(event, { depth: null }),
      context: inspect(context, { depth: null }),
    });

    const eventSourceName = guessEventSourceBasedOnEvent(event);
    const eventSource = getEventSource(eventSourceName);

    try {
      return await forwardRequestToNodeServer({
        app,
        event,
        context,
        eventSource,
        logger,
      });
    } catch (err) {
      return respondToEventSourceWithError({
        error: err as Error,
        eventSource,
        logger,
      });
    }
  };
}
