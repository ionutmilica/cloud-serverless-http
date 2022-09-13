import type { OutgoingHttpHeaders } from 'http';
import type { APIGatewayEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { format } from 'url';

/**
 * Extract the body buffer from an api-gateway event
 * @param event
 * @return Buffer
 */
export function getEventBody(event: APIGatewayEvent | APIGatewayProxyEventV2): Buffer {
  return Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
}

/**
 * Extract client real ip from the event
 *
 * @param event
 * @return string
 */
export function getRemoteAddressFromEvent(event: APIGatewayEvent): string {
  return (
    (event &&
      event.requestContext &&
      event.requestContext.identity &&
      event.requestContext.identity.sourceIp) ||
    ''
  );
}

type CommaDelimitedHeaders = { [key: string]: string };

export function getCommaDelimitedHeaders(headers: {
  [key: string]: string[] | string | number | undefined;
}): CommaDelimitedHeaders {
  const commaDelimitedHeaders: CommaDelimitedHeaders = {};

  Object.entries(headers).forEach(([headerKey, headerValue]) => {
    const newKey = headerKey.toLowerCase();
    if (Array.isArray(headerValue)) {
      commaDelimitedHeaders[newKey] = headerValue.join(',');
    } else if (typeof headerValue === 'string') {
      commaDelimitedHeaders[newKey] = headerValue;
    } else if (typeof headerValue === 'number') {
      commaDelimitedHeaders[newKey] = String(headerValue);
    }
  });

  return commaDelimitedHeaders;
}

type ApiGwResultMultiValueHeaders = { [key: string]: (string | number | boolean)[] };
export function getMultiValueHeaders(headers: OutgoingHttpHeaders): ApiGwResultMultiValueHeaders {
  const multiValueHeaders: ApiGwResultMultiValueHeaders = {};

  Object.entries(headers).forEach(([headerKey, headerValue]) => {
    if (headerValue) {
      multiValueHeaders[headerKey.toLowerCase()] = Array.isArray(headerValue)
        ? headerValue
        : [String(headerValue)];
    }
  });

  return multiValueHeaders;
}

type ApiGwResultHeaders = { [key: string]: string | number | boolean };
export function sanitizeHeaders(headers: OutgoingHttpHeaders): ApiGwResultHeaders | undefined {
  const sanitizedHeaders: ApiGwResultHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null && typeof value !== 'undefined' && !Array.isArray(value)) {
      sanitizedHeaders[key] = value;
    }
  }
  return sanitizedHeaders;
}

export function getPathWithQueryStringParams(event: APIGatewayEvent): string {
  const stripBasePath = '';
  const replaceRegex = new RegExp(`^${stripBasePath}`);
  const query = event.multiValueQueryStringParameters || event.queryStringParameters || {};
  // NOTE: Use `event.pathParameters.proxy` if available ({proxy+}); fall back to `event.path`
  const path =
    (event.pathParameters && event.pathParameters.proxy && `/${event.pathParameters.proxy}`) ||
    event.path;

  return format({
    pathname: path.replace(replaceRegex, ''),
    query,
  });
}

export function getPathWithQueryStringParamsV2(event: APIGatewayProxyEventV2): string {
  const requestPathOrRawPath = event.rawPath;
  const basePath = '';
  const stripBasePathRegex = new RegExp(`^${basePath}`);
  return format({
    pathname: requestPathOrRawPath.replace(stripBasePathRegex, ''),
    search: event.rawQueryString,
  });
}
