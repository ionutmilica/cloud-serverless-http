import type { OutgoingHttpHeaders } from 'http';
import { isBinary } from './binary';

describe('Test isBinary function', () => {
  describe('Handle content encoding', () => {
    it('should return true if content-encoding is binary like', () => {
      const headers: OutgoingHttpHeaders = { 'content-encoding': 'br' };
      const result = isBinary(headers);
      expect(result).toBe(true);
    });
    it('should handle content-encoding that is merged', () => {
      const headers: OutgoingHttpHeaders = { 'content-encoding': 'blah, deflate' };
      const result = isBinary(headers);
      expect(result).toBe(true);
    });
  });

  describe('Handle content type', () => {
    it('should return true if content is image', () => {
      const headers: OutgoingHttpHeaders = { 'content-type': 'image/png' };
      const result = isBinary(headers);
      expect(result).toBe(true);
    });

    it('should return true if content is image but has parameter set', () => {
      const headers: OutgoingHttpHeaders = { 'content-type': 'image/png; parameter=blah' };
      const result = isBinary(headers);
      expect(result).toBe(true);
    });

    it('should return false if content is non supported binary types', () => {
      const headers: OutgoingHttpHeaders = { 'content-type': 'text-plain; charset=utf8' };
      const result = isBinary(headers);
      expect(result).toBe(false);
    });
  });
});
