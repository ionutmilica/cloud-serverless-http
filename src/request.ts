import { Buffer } from 'buffer';
import { IncomingMessage, IncomingHttpHeaders } from 'http';
import { CustomSocket } from './net/socket';

export interface ServerlessRequestOpts {
  method: string;
  url: string;
  headers: IncomingHttpHeaders;
  remoteAddress: string;
  body: Buffer | string;
}

export class ServerlessRequest extends IncomingMessage {
  incomingBody: Buffer | string | Uint8Array;

  constructor({ method, url, headers, body, remoteAddress }: ServerlessRequestOpts) {
    super(new CustomSocket());

    if (typeof headers['content-length'] === 'undefined') {
      headers['content-length'] = String(Buffer.byteLength(body));
    }

    Object.assign(this, {
      ip: remoteAddress,
      complete: true,
      httpVersion: '1.1',
      httpVersionMajor: '1',
      httpVersionMinor: '1',
      method,
      headers,
      body,
      url,
    });

    this.incomingBody = body;

    this._read = () => {
      this.push(body);
      this.push(null);
    };
  }
}
