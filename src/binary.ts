import type { OutgoingHttpHeaders } from 'http';

const binaryEncodingTypes = ['gzip', 'compress', 'deflate', 'br'];
const binaryContentTypes = ['image/*'];

function extractContentType(headers: OutgoingHttpHeaders): string {
  const contentTypeHeader = String(headers['content-type']) || '';
  return contentTypeHeader.split(';')[0];
}

function isContentEncodingBinary(headers: OutgoingHttpHeaders): boolean {
  const contentEncoding = headers['content-encoding'];
  if (!contentEncoding) {
    return false;
  }
  let encodings: string[];

  if (typeof contentEncoding === 'string') {
    encodings = contentEncoding.replace(' ', '').split(',');
  } else if (Array.isArray(contentEncoding)) {
    encodings = contentEncoding;
  } else {
    encodings = [];
  }
  return encodings.some((value) => binaryEncodingTypes.includes(value));
}

function isContentTypeBinary(headers: OutgoingHttpHeaders) {
  if (!binaryContentTypes || !Array.isArray(binaryContentTypes)) {
    return false;
  }

  const binaryContentTypesRegexes = binaryContentTypes.map(
    (binaryContentType) => new RegExp(`^${binaryContentType.replace(/\*/g, '.*')}$`),
  );

  const contentType = extractContentType(headers);
  if (!contentType) {
    return false;
  }

  return binaryContentTypesRegexes.some((binaryContentType) => binaryContentType.test(contentType));
}

export function isBinary(headers: OutgoingHttpHeaders): boolean {
  return isContentEncodingBinary(headers) || isContentTypeBinary(headers);
}
