import type { Context } from 'aws-lambda';
import { getRequest, getResponse } from './api-gateway-v1';
import { makeV1Event } from '../../../__jest-utils__/events/v1';

describe('Test Api Gateway V1 integration', () => {
  describe('Test getRequest', () => {
    describe('Check Authorization logic', () => {
      it('Should overwrite authorization header if using custom authorizer', async () => {
        const transformedRequest = getRequest({
          event: makeV1Event((evt) => ({
            ...evt,
            requestContext: {
              ...evt.requestContext,
              authorizer: {
                authorization: 'custom-token',
              },
            },
          })),
          context: {} as Context,
        });
        expect(transformedRequest.headers.authorization).toEqual('Bearer custom-token');
      });

      it('Should use client Authorization header if authorizer is not present', async () => {
        const transformedRequest = getRequest({
          event: makeV1Event((evt) => ({
            ...evt,
            headers: {
              Authorization: 'from-headers',
            },
            multiValueHeaders: {
              Authorization: ['from-headers'],
            },
            requestContext: {
              ...evt.requestContext,
              authorizer: {
                authorization: '',
              },
            },
          })),
          context: {} as Context,
        });
        expect(transformedRequest.headers.authorization).toEqual('from-headers');
      });
    });

    describe('GET Request', () => {
      const event = makeV1Event((evt) => ({
        ...evt,
        path: '/v1/providers',
        queryStringParameters: {
          sortBy: 'name',
        },
        multiValueQueryStringParameters: {
          sortBy: ['name'],
        },
        requestContext: {
          ...evt.requestContext,
          requestId: 'test-req-id',
          stage: 'test-stage',
        },
      }));

      const transformedRequest = getRequest({
        event: event,
        context: {} as Context,
      });

      it('Should process the httpMethod property', async () => {
        expect(transformedRequest.method).toEqual(event.httpMethod);
      });

      it('Should compute the path with query parameters', async () => {
        expect(transformedRequest.path).toEqual('/v1/providers?sortBy=name');
      });

      it('Should convert the body from string to buffer', async () => {
        expect(transformedRequest.body).not.toBeNull();
        expect(transformedRequest.body.toString()).toEqual(event.body);
      });

      it('Should have the requestId and stage passed as x-headers', async () => {
        expect(transformedRequest.headers).toEqual(
          expect.objectContaining({
            'x-stage': 'test-stage',
            'x-request-id': 'test-req-id',
          }),
        );
      });
    });

    describe('POST Request', () => {
      const event = makeV1Event((evt) => ({
        ...evt,
        httpMethod: 'POST',
        path: '/v1/authenticate',
        queryStringParameters: {},
        multiValueQueryStringParameters: {},
        body: `{\n    "username": "user",\n    "password": "password"\n}`,
      }));

      const transformedRequest = getRequest({
        event: event,
        context: {} as Context,
      });

      it('Should process the httpMethod property', async () => {
        expect(transformedRequest.method).toEqual('POST');
      });

      it('Should compute the path with query parameters', async () => {
        expect(transformedRequest.path).toEqual('/v1/authenticate');
      });

      it('Should convert the body from string to buffer', async () => {
        expect(transformedRequest.body.toString()).toContain('"password": "password"');
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
        body: JSON.stringify({ productId: 11 }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
        multiValueHeaders: {
          'content-type': ['application/json'],
        },
        statusCode: 200,
      });
    });
  });
});
