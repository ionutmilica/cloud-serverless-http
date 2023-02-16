import type { Context } from 'aws-lambda';
import { getRequest, getResponse, sanitiseHeaders } from './legacy-internal-lambda';
import { makeInternalEvent } from '../../../__jest-utils__/events/internal';

describe('Test Internal Lambda integration', () => {
  describe('Test sanitiseHeaders', () => {
    it('Should clean undefined headers', () => {
      const sanitisedHeaders = sanitiseHeaders({ 'content-type': undefined });
      expect(sanitisedHeaders).toEqual({});
    });

    it('Should convert number to string in header values', () => {
      const sanitisedHeaders = sanitiseHeaders({ 'content-length': 22 });
      expect(sanitisedHeaders).toEqual({ 'content-length': '22' });
    });

    it('Should keep proper formatted headers', () => {
      const sanitisedHeaders = sanitiseHeaders({ 'content-type': 'application/json' });
      expect(sanitisedHeaders).toEqual({ 'content-type': 'application/json' });
    });
  });

  describe('Test getRequest', () => {
    describe('Check happy flow', () => {
      const event = makeInternalEvent((evt) => ({
        ...evt,
        path: '/authenticate',
        request: {
          params: {
            username: 'johnny',
            password: 'bravo',
          },
        },
      }));
      const transformedRequest = getRequest({ event, context: {} as Context });

      it('Should use proper httpMethod', async () => {
        expect(transformedRequest.method).toEqual('POST');
      });

      it('Should generate a buffer body', async () => {
        expect(transformedRequest.body.toString()).toEqual(
          JSON.stringify({ username: 'johnny', password: 'bravo' }),
        );
      });

      it('Should have the proper http headers set', async () => {
        expect(transformedRequest.headers['content-type']).toEqual('application/json');
        expect(transformedRequest.headers['content-length']).toEqual(
          `${transformedRequest.body.length}`,
        );
      });
    });
  });

  describe('Test getResponse', () => {
    const basicResponsePayload = Buffer.from(JSON.stringify({ productId: 11 }));
    const transformedResponse = getResponse({
      statusCode: 200,
      body: basicResponsePayload,
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });

    it('Should transform the body for api gateway', async () => {
      expect(transformedResponse).toEqual({
        data: { productId: 11 },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
      });
    });
  });

  it('Should support errors', async () => {
    const basicResponsePayload = Buffer.from(JSON.stringify({}));
    const transformedResponse = getResponse({
      statusCode: 200,
      error: new Error('happens'),
      body: basicResponsePayload,
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });

    expect(transformedResponse).toEqual({
      statusCode: 500,
      headers: {},
      error: {
        errorCode: 'LIBRARY_ERROR',
        errorDescription: 'Library failure: Error: happens',
      },
    });
  });
});
