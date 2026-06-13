import type { z } from 'zod';

export type Result<T, E = Error> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

// Extracts parameters from strings like /users/:userId/posts/:postId
export type ExtractRouteParams<T extends string> = 
  T extends `${string}:${infer Param}/${infer Rest}` 
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string | number }
    : T extends `${string}:${infer Param}` 
    ? { [K in Param]: string | number } 
    // Fallback to allow empty params if no match
    : Record<string, never>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface EndpointDef<
  Path extends string,
  Query extends z.ZodTypeAny | undefined = undefined,
  Body extends z.ZodTypeAny | undefined = undefined,
  Response extends z.ZodTypeAny | undefined = undefined
> {
  path: Path;
  method: HttpMethod;
  query?: Query;
  body?: Body;
  response?: Response;
  // Optional configuration per-endpoint
  cacheTtl?: number; // In milliseconds
  rateLimit?: { requests: number; windowMs: number };
  retry?: { attempts: number; delayMs: number };
}

export type AnyEndpoint = EndpointDef<any, any, any, any>;

export type InferRequestOptions<E extends AnyEndpoint> = {
  // Enforce `params` if the path contains dynamic segments
  params: keyof ExtractRouteParams<E['path']> extends never 
    ? undefined | Record<string, never>
    : ExtractRouteParams<E['path']>;
} & (
  E['query'] extends z.ZodTypeAny ? { query: z.input<E['query']> } : { query?: undefined }
) & (
  E['body'] extends z.ZodTypeAny ? { body: z.input<E['body']> } : { body?: undefined }
) & {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  // Overrides
  skipCache?: boolean;
};

export type InferResponse<E extends AnyEndpoint> = E['response'] extends z.ZodTypeAny 
  ? z.output<E['response']> 
  : unknown;
