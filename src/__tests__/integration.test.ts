import { createHandler } from '../handler';
import { makeV1Event, defaultContext } from '../../__jest-utils__/events/v1';
import { makeV2Event } from '../../__jest-utils__/events/v2';

import express from 'express';
import * as bodyParser from 'body-parser';

const dummyCallback = () => undefined;

function makeServerWithRoutes() {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: '1mb' }));
  app.get('/product-details/:id', (req, res) => {
    const productId = req.params.id;
    res.status(200).json({ productId, productTitle: 'My product', type: 'Speaking' });
  });
  app.post('/products', (req, res) => {
    const title = req.body.title;
    const price = +req.body.price;
    res.status(200).json({ productId: 'blah-id', title, price });
  });
  app.post('/cookies', (req, res) => {
    res
      .status(200)
      .cookie('SessionID', '44')
      .cookie('SecondCookie', 'johnny')
      .setHeader('X-Custom-Header', 'custom-header')
      .json({ message: 'ok' });
  });
  return app;
}

describe('Test Integration with Express', () => {
  describe('Test ApiGateway V1 events', () => {
    test('that everything is ok', async () => {
      const expectedResponse = {
        productTitle: 'My product',
        type: 'Speaking',
      };
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'error' });
      const event = makeV1Event((evt) => ({
        ...evt,
        path: '/product-details/my-product',
        httpMethod: 'GET',
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response).not.toBeNull();
      expect(response.statusCode).toEqual(200);
      expect(response.body).not.toBeNull();
      expect(JSON.parse(response.body)).toEqual({ productId: 'my-product', ...expectedResponse });
    });

    it('should handle post with body', async () => {
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'debug' });
      const event = makeV1Event((evt) => ({
        ...evt,
        body: JSON.stringify({ title: 'blah', price: 50 }),
        path: '/products',
        httpMethod: 'POST',
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        JSON.stringify({ productId: 'blah-id', title: 'blah', price: 50 }),
      );
    });

    it('should handle cookies', async () => {
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'error' });
      const event = makeV1Event((evt) => ({
        ...evt,
        path: '/cookies',
        httpMethod: 'POST',
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response).not.toBeNull();
      expect(response.statusCode).toEqual(200);
      expect(JSON.parse(response.body)).toEqual({ message: 'ok' });
      expect(response.multiValueHeaders).toEqual(
        expect.objectContaining({
          'set-cookie': ['SessionID=44; Path=/', 'SecondCookie=johnny; Path=/'],
          'x-custom-header': ['custom-header'],
        }),
      );
    });
    it('should handle cookies', async () => {
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'error' });
      const event = makeV1Event((evt) => ({
        ...evt,
        path: '/cookies',
        httpMethod: 'POST',
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response).not.toBeNull();
      expect(response.statusCode).toEqual(200);
      expect(JSON.parse(response.body)).toEqual({ message: 'ok' });
      expect(response.multiValueHeaders).toEqual(
        expect.objectContaining({
          'set-cookie': ['SessionID=44; Path=/', 'SecondCookie=johnny; Path=/'],
          'x-custom-header': ['custom-header'],
        }),
      );
    });
  });
  describe('Test ApiGateway V2 events', () => {
    test('that everything is ok', async () => {
      const expectedResponse = {
        productTitle: 'My product',
        type: 'Speaking',
      };
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'error' });
      const event = makeV2Event((evt) => ({
        ...evt,
        rawPath: '/product-details/my-product',
        requestContext: {
          ...evt.requestContext,
          http: {
            ...evt.requestContext.http,
            method: 'GET',
          },
        },
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response).not.toBeNull();
      expect(response.statusCode).toEqual(200);
      expect(response.body).not.toBeNull();
      expect(JSON.parse(response.body)).toEqual({ productId: 'my-product', ...expectedResponse });
    });

    it('should handle not found errors', async () => {
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'error' });
      const event = makeV2Event((evt) => ({
        ...evt,
        rawPath: '/not-found',
        requestContext: {
          ...evt.requestContext,
          http: {
            ...evt.requestContext.http,
            method: 'GET',
          },
        },
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toContain('Cannot GET /not-found');
    });

    it('should handle post with body', async () => {
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'debug' });
      const event = makeV2Event((evt) => ({
        ...evt,
        rawPath: '/products',
        requestContext: {
          ...evt.requestContext,
          http: {
            ...evt.requestContext.http,
            method: 'POST',
          },
        },
        body: JSON.stringify({ title: 'blah', price: 50 }),
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        JSON.stringify({ productId: 'blah-id', title: 'blah', price: 50 }),
      );
    });

    it('should handle cookies', async () => {
      const app = makeServerWithRoutes();
      const handler = createHandler({ app, logLevel: 'error' });
      const event = makeV2Event((evt) => ({
        ...evt,
        rawPath: '/cookies',
        requestContext: {
          ...evt.requestContext,
          http: {
            ...evt.requestContext.http,
            method: 'POST',
          },
        },
      }));

      const response = await handler(event, defaultContext, dummyCallback);

      expect(response).not.toBeNull();
      expect(response.statusCode).toEqual(200);
      expect(JSON.parse(response.body)).toEqual({ message: 'ok' });
      expect(response.cookies).toEqual(['SessionID=44; Path=/', 'SecondCookie=johnny; Path=/']);
      expect(response.headers).toEqual(
        expect.objectContaining({
          'x-custom-header': 'custom-header',
        }),
      );
    });
  });
});
