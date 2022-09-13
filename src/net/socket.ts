import { Socket as BaseSocket, AddressInfo } from 'net';

type ErrorCallback = (err?: Error) => void;
type Callback = () => void;
type HandlerFn = (str: Uint8Array | string) => void;

export class CustomSocket extends BaseSocket {
  writable = true;
  readable = true;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _writableState = {};

  writeHandlerFn?: HandlerFn;
  endHandlerFn?: HandlerFn;

  constructor(opts: { writeHandlerFn?: HandlerFn } = {}) {
    super();

    if (opts.writeHandlerFn) {
      this.writeHandlerFn = opts.writeHandlerFn;
    }
  }

  address(): AddressInfo | {} {
    return { port: 443, address: '0.0.0.0', family: 'IPv4' };
  }

  on(event: string, listener: (...args: any[]) => void): this {
    return this;
  }
  removeListener(event: string): this {
    return this;
  }
  cork() {
    // Do nothing
  }
  uncork() {
    // Do nothing
  }

  end(
    str?: Uint8Array | string | Callback,
    encoding?: BufferEncoding | Callback,
    cb?: Callback,
  ): this {
    return this;
  }

  write(
    buffer: Uint8Array | string,
    encoding?: BufferEncoding | ErrorCallback,
    cb?: ErrorCallback,
  ): boolean {
    if (typeof encoding === 'function') {
      // eslint-disable-next-line no-param-reassign
      cb = encoding;
    }

    // Apply hook here if provided
    this.writeHandlerFn && this.writeHandlerFn(buffer);

    if (typeof cb === 'function') {
      cb();
    }

    return true;
  }

  destroy(error?: Error): this {
    return this;
  }
}
