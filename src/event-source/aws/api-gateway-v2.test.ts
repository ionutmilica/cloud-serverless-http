import type { Context } from 'aws-lambda';
import { getRequest, getResponse } from './api-gateway-v2';
import { makeV2Event } from '../../../__jest-utils__/events/v2';

describe('Test Api Gateway V1 integration', () => {
  describe('Test getRequest', () => {
    describe('GET Request', () => {
      const event = makeV2Event((evt) => ({
        ...evt,
        requestContext: {
          ...evt.requestContext,
          http: {
            ...evt.requestContext.http,
            method: 'GET',
          },
        },
        cookies: ['SESSIONID=1293812hjas', 'VISITED=yes'],
        rawPath: '/v1/providers',
        rawQueryString: 'sortBy=name',
      }));

      const transformedRequest = getRequest({
        event: event,
        context: {} as Context,
      });

      it('Should process the httpMethod property', async () => {
        expect(transformedRequest.method).toEqual(event.requestContext.http.method);
      });

      it('Should compute the path with query parameters', async () => {
        expect(transformedRequest.path).toEqual('/v1/providers?sortBy=name');
      });

      it('Should add the cookies in headers', async () => {
        expect(transformedRequest.headers).not.toBeNull();
        expect(transformedRequest.headers['cookie']).toEqual('SESSIONID=1293812hjas; VISITED=yes');
      });

      it('Should convert the body from string to buffer', async () => {
        expect(transformedRequest.body).not.toBeNull();
        expect(transformedRequest.body.toString()).toEqual(event.body);
      });
    });

    describe('POST Request', () => {
      const event = makeV2Event((evt) => ({
        ...evt,
        requestContext: {
          ...evt.requestContext,
          http: {
            ...evt.requestContext.http,
            method: 'POST',
          },
        },
        rawPath: '/v1/authenticate',
        rawQueryString: '',
        cookies: undefined,
        headers: {
          ...evt.headers,
          'X-Custom-Header': 'my value',
        },
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

      it('Should contain the custom header', async () => {
        expect(transformedRequest.headers).not.toBeNull();
        expect(transformedRequest.headers['x-custom-header']).toEqual('my value');
      });

      it('Should not contain the cookie in header if there are no cookies', async () => {
        expect(transformedRequest.headers).not.toBeNull();
        expect(transformedRequest.headers['cookie']).not.toBeDefined();
      });

      it('Should convert the body from string to buffer', async () => {
        expect(transformedRequest.body.toString()).toContain('"password": "password"');
      });
    });
  });

  describe('Test getResponse', () => {
    describe('Happy flow', () => {
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
          statusCode: 200,
        });
      });
    });

    describe('When cookies are provided to the response transformer', () => {
      const basicResponsePayload = Buffer.from(JSON.stringify({ productId: 11 }));
      const transformedResponse = getResponse({
        statusCode: 200,
        body: basicResponsePayload,
        headers: {
          'content-type': 'application/json',
          'set-cookie': ['MyCookie=value', 'SessionID=12312'],
        },
        isBase64Encoded: false,
      });

      it('Should transform the body for api gateway', async () => {
        expect(transformedResponse).toEqual({
          body: JSON.stringify({ productId: 11 }),
          headers: { 'content-type': 'application/json' },
          cookies: ['MyCookie=value', 'SessionID=12312'],
          isBase64Encoded: false,
          statusCode: 200,
        });
      });
    });
  });
});
