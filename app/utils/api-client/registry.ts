import { z } from 'zod';
import type { EndpointDef, HttpMethod } from './types';

/**
 * Helper function to create strongly typed endpoint definitions
 */
export function defineEndpoint<
  Path extends string,
  Query extends z.ZodTypeAny | undefined = undefined,
  Body extends z.ZodTypeAny | undefined = undefined,
  Response extends z.ZodTypeAny | undefined = undefined
>(def: {
  path: Path;
  method: HttpMethod;
  query?: Query;
  body?: Body;
  response?: Response;
  cacheTtl?: number;
  rateLimit?: { requests: number; windowMs: number };
  retry?: { attempts: number; delayMs: number };
}): EndpointDef<Path, Query, Body, Response> {
  return def;
}

// ---------------------------------------------------------
// Example Registry (Used in our Demos and Tests)
// ---------------------------------------------------------

export const ApiRegistry = {
  // 1. Basic GET with Cache & Zod validation
  getUser: defineEndpoint({
    method: 'GET',
    path: '/users/:id',
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
    }),
    cacheTtl: 5000, // Cache for 5 seconds
  }),

  // 2. POST with Body Validation
  createUser: defineEndpoint({
    method: 'POST',
    path: '/users',
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
    }),
    response: z.object({
      id: z.number(),
      success: z.boolean(),
    }),
  }),

  // 3. Search with Query Params & Rate Limiting
  searchPosts: defineEndpoint({
    method: 'GET',
    path: '/posts',
    query: z.object({
      q: z.string().min(1),
      limit: z.number().max(100).optional().default(10),
    }),
    response: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
      })
    ),
    rateLimit: { requests: 3, windowMs: 10000 }, // 3 requests per 10 seconds
  }),

  // 4. Failing Endpoint with Retry Logic
  flakyEndpoint: defineEndpoint({
    method: 'GET',
    path: '/flaky',
    response: z.object({
      message: z.string(),
    }),
    retry: { attempts: 3, delayMs: 100 }, // Retry 3 times, exponential backoff starting at 100ms
  }),
};
