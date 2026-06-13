import { describe, it, expect, expectTypeOf, vi, beforeEach } from 'vitest';
import { ApiClient } from '../app/utils/api-client/client';
import { ApiRegistry } from '../app/utils/api-client/registry';

// Mock fetch globally
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.mockReset();
    client = new ApiClient({ baseUrl: 'https://api.example.com' });
  });

  describe('Type Inference & Basic Requests', () => {
    it('infers params and successful response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'John Doe', email: 'john@example.com' }),
      });

      // Type-checking: `params` is required because of `:id` in path.
      // @ts-expect-error - params is missing
      // client.request(ApiRegistry.getUser, {});

      const result = await client.request(ApiRegistry.getUser, {
        params: { id: 1 },
      });

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users/1', expect.anything());
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expectTypeOf(result.data.id).toBeNumber();
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('infers body payload for POST requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, success: true }),
      });

      // Type-checking: `body` requires name and email
      // @ts-expect-error
      // client.request(ApiRegistry.createUser, { body: { name: 'A' } });

      const result = await client.request(ApiRegistry.createUser, {
        params: undefined, // Explicitly no params required
        body: { name: 'Jane', email: 'jane@example.com' },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
      }
    });

    it('validates query parameters with Zod', async () => {
      // Missing 'q' which is required
      const result = await client.request(ApiRegistry.searchPosts, {
        params: undefined,
        // @ts-expect-error
        query: { limit: 10 }, 
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Query Validation Error');
      }
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Caching', () => {
    it('caches GET requests based on TTL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'John', email: 'john@example.com' }),
      });

      // First request (hits network)
      await client.request(ApiRegistry.getUser, { params: { id: 1 } });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second request (hits cache)
      await client.request(ApiRegistry.getUser, { params: { id: 1 } });
      expect(fetchMock).toHaveBeenCalledTimes(1); // Still 1

      // Request with different params (hits network)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, name: 'Jane', email: 'jane@example.com' }),
      });
      await client.request(ApiRegistry.getUser, { params: { id: 2 } });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    it('blocks requests over the limit', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ([]),
      });

      // Limit is 3 per 10 seconds for searchPosts
      const reqs = [];
      for (let i = 0; i < 4; i++) {
        reqs.push(client.request(ApiRegistry.searchPosts, { params: undefined, query: { q: 'test' } }));
      }

      const results = await Promise.all(reqs);
      
      const successes = results.filter(r => r.ok);
      const failures = results.filter(r => !r.ok);

      expect(successes.length).toBe(3);
      expect(failures.length).toBe(1);
      if (!failures[0]!.ok) {
        expect(failures[0]!.error.message).toBe('Rate limit exceeded');
      }
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Retries', () => {
    it('retries failed requests using exponential backoff', async () => {
      // Fail twice, succeed on third
      fetchMock
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Finally worked' }),
        });

      const startTime = Date.now();
      const result = await client.request(ApiRegistry.flakyEndpoint, { params: undefined });
      const duration = Date.now() - startTime;

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      
      // Delays: 100ms * 2^0 = 100ms. 100ms * 2^1 = 200ms. Total ~300ms.
      expect(duration).toBeGreaterThanOrEqual(250);
    });
  });
});
