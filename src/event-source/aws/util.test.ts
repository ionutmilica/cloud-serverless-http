import { makeV1Event } from '../../../__jest-utils__/events/v1';
import { makeV2Event } from '../../../__jest-utils__/events/v2';
import {
  getEventBody,
  getCommaDelimitedHeaders,
  getPathWithQueryStringParams,
  getPathWithQueryStringParamsV2,
} from './util';

describe('Test Util', () => {
  describe('Test getEventBody', () => {
    test('Should return a proper buffer in the happy flow', async () => {
      const expectedBody = { title: 'My new post', author: 'Johnny Tsu' };
      const event = makeV1Event((evt) => ({ ...evt, body: JSON.stringify(expectedBody) }));
      const buf = getEventBody(event);
      expect(buf).not.toBeNull();
      expect(JSON.parse(buf.toString())).toEqual(expectedBody);
    });

    test('Should support base64 if flag is provided in event', async () => {
      const expectedBody = { title: 'My new post', author: 'Johnny Tsu' };
      const event = makeV1Event((evt) => ({
        ...evt,
        body: Buffer.from(JSON.stringify(expectedBody)).toString('base64'),
      }));
      const buf = getEventBody(event);
      expect(buf).not.toBeNull();
      expect(JSON.parse(Buffer.from(buf.toString(), 'base64').toString())).toEqual(expectedBody);
    });
  });

  describe('Test getCommaDelimitedHeaders function', () => {
    test('Should work for single value headers', () => {
      const inHeaders = {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
      };
      const outHeaders = {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
      };
      const headers = getCommaDelimitedHeaders(inHeaders);
      expect(headers).toEqual(outHeaders);
    });

    test('Should work for multiple value headers', () => {
      const inHeaders = {
        Accept: '*/*',
        'Accept-Encoding': ['gzip', 'deflate', 'br'],
      };
      const outHeaders = {
        accept: '*/*',
        'accept-encoding': 'gzip,deflate,br',
      };
      const headers = getCommaDelimitedHeaders(inHeaders);
      expect(headers).toEqual(outHeaders);
    });
  });

  describe('Test getPathWithQueryStringParams function', () => {
    const event = makeV1Event((evt) => ({
      ...evt,
      path: '/v1/users',
      multiValueQueryStringParameters: {
        name: ['johnny', 'joe'],
      },
    }));
    const path = getPathWithQueryStringParams(event);
    expect(path).toEqual('/v1/users?name=johnny&name=joe');
  });

  describe('Test getPathWithQueryStringParamsV2 function', () => {
    const event = makeV2Event((evt) => ({
      ...evt,
      rawPath: '/v1/users',
      rawQueryString: 'name=johnny&name=joe',
    }));
    const path = getPathWithQueryStringParamsV2(event);
    expect(path).toEqual('/v1/users?name=johnny&name=joe');
  });
});
