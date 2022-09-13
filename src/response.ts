import { Buffer } from 'buffer';
import { ServerResponse, IncomingHttpHeaders } from 'http';
import { TextDecoder } from 'util';
import { ServerlessRequest } from './request';
import { CustomSocket } from './net/socket';

const headerEnd = '\r\n\r\n';

function getString(data: Buffer | string | any) {
  if (Buffer.isBuffer(data)) {
    return data.toString();
  } else if (typeof data === 'string') {
    return data;
  } else if (data instanceof Uint8Array) {
    return new TextDecoder().decode(data);
  }
  throw new Error(`response.write() of unexpected type: ${typeof data}`);
}

export function getBodyBuffer(res: ServerlessResponse): Buffer {
  return Buffer.concat(res.__body);
}

export class ServerlessResponse extends ServerResponse {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __headers: IncomingHttpHeaders;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __body: Buffer[];

  // Node http internals
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _header: string | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _wroteHeader: boolean | null;

  constructor(req: ServerlessRequest) {
    super(req);

    this.addData = this.addData.bind(this);
    this.getBodyBuffer = this.getBodyBuffer.bind(this);

    this.__body = [];
    this.__headers = {};

    this.useChunkedEncodingByDefault = false;
    this.chunkedEncoding = false;
    this._header = '';

    this._wroteHeader = false;

    const socket = new CustomSocket({
      writeHandlerFn: (buffer: Uint8Array | string) => {
        if (this._header === '' || this._wroteHeader) {
          this.addData(buffer);
        } else {
          const string = getString(buffer);
          const index = string.indexOf(headerEnd);

          if (index !== -1) {
            const remainder = string.slice(index + headerEnd.length);

            if (remainder) {
              this.addData(remainder);
            }

            this._wroteHeader = true;
          }
        }
      },
    });

    this.assignSocket(socket);
  }

  get headers(): IncomingHttpHeaders {
    return this.__headers;
  }

  static from(req: ServerlessRequest): ServerResponse {
    const response = new ServerlessResponse(req);
    response.statusCode = req.statusCode || 500;
    response.end();
    return response;
  }

  public getBodyBuffer(): Buffer {
    return Buffer.concat(this.__body);
  }

  private addData(data: Buffer | string | Uint8Array | any): void {
    if (Buffer.isBuffer(data) || typeof data === 'string' || data instanceof Uint8Array) {
      this.__body.push(Buffer.from(data));
    } else {
      throw new Error(`response.write() of unexpected type: ${typeof data}`);
    }
  }
}
