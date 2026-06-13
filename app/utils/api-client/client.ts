import { CacheManager } from './cache';
import { RateLimiter } from './rateLimit';
import { withRetry } from './retry';
import type { AnyEndpoint, InferRequestOptions, InferResponse, Result } from './types';

export interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  // Global interceptors
  onRequest?: (req: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: (res: Response) => Response | Promise<Response>;
  // Optional custom fetch for mocking
  fetch?: typeof fetch;
}

export class ApiClient {
  private cache = new CacheManager();
  private rateLimiter = new RateLimiter();

  constructor(private config: ApiClientConfig) {}

  /**
   * Main typed request method
   */
  async request<E extends AnyEndpoint>(
    endpoint: E,
    options: InferRequestOptions<E>
  ): Promise<Result<InferResponse<E>>> {
    
    // 1. Rate Limiting Check
    if (endpoint.rateLimit) {
      const allowed = this.rateLimiter.checkLimit(
        endpoint.path, 
        endpoint.rateLimit.requests, 
        endpoint.rateLimit.windowMs
      );
      if (!allowed) {
        return { ok: false, error: new Error('Rate limit exceeded') };
      }
    }

    // 2. Build URL & Path Params
    let path = endpoint.path as string;
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        path = path.replace(`:${key}`, encodeURIComponent(String(value)));
      }
    }

    // 3. Build Query String & Validate
    const searchParams = new URLSearchParams();
    let queryData = options.query;
    if (endpoint.query && options.query) {
      const parsedQuery = endpoint.query.safeParse(options.query);
      if (!parsedQuery.success) {
        return { ok: false, error: new Error(`Query Validation Error: ${parsedQuery.error.message}`) };
      }
      queryData = parsedQuery.data;
      for (const [key, value] of Object.entries(queryData as Record<string, any>)) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const fullUrl = `${this.config.baseUrl}${path}${queryString}`;

    // 4. Cache Check (GET requests only by default)
    const cacheKey = this.cache.generateKey(endpoint.method, fullUrl, options.params, queryData);
    if (endpoint.method === 'GET' && endpoint.cacheTtl && !options.skipCache) {
      const cachedResponse = this.cache.get<InferResponse<E>>(cacheKey);
      if (cachedResponse) {
        return { ok: true, data: cachedResponse };
      }
    }

    // 5. Build Body & Validate
    let bodyData: BodyInit | undefined;
    if (endpoint.body && options.body) {
      const parsedBody = endpoint.body.safeParse(options.body);
      if (!parsedBody.success) {
        return { ok: false, error: new Error(`Body Validation Error: ${parsedBody.error.message}`) };
      }
      bodyData = JSON.stringify(parsedBody.data);
    }

    // 6. Execute Request with Retry & Interceptors
    const executeFetch = async () => {
      let reqInit: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.defaultHeaders,
          ...options.headers,
        },
        body: bodyData,
        signal: options.signal,
      };

      if (this.config.onRequest) {
        reqInit = await this.config.onRequest(reqInit);
      }

      const fetchImpl = this.config.fetch || globalThis.fetch;
      let res = await fetchImpl(fullUrl, reqInit);

      if (this.config.onResponse) {
        res = await this.config.onResponse(res);
      }

      if (!res.ok) {
        // We throw here so `withRetry` can catch it and retry if configured
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }

      // 7. Parse & Validate Response
      const json = await res.json();
      if (endpoint.response) {
        const parsedResponse = endpoint.response.safeParse(json);
        if (!parsedResponse.success) {
          throw new Error(`Response Validation Error: ${parsedResponse.error.message}`);
        }
        return parsedResponse.data as InferResponse<E>;
      }
      
      return json as InferResponse<E>;
    };

    try {
      const retryConfig = endpoint.retry || { attempts: 0, delayMs: 0 };
      const responseData = await withRetry(executeFetch, retryConfig.attempts, retryConfig.delayMs);

      // 8. Cache Response
      if (endpoint.method === 'GET' && endpoint.cacheTtl && !options.skipCache) {
        this.cache.set(cacheKey, responseData, endpoint.cacheTtl);
      }

      return { ok: true, data: responseData };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  // Clear caches manually
  clearCache() {
    this.cache.clear();
  }
}
