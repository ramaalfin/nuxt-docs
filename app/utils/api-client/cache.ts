export class CacheManager {
  private cache = new Map<string, { value: any; expiry: number }>();

  /**
   * Deterministic cache key generation based on request parameters
   */
  generateKey(method: string, url: string, params?: unknown, query?: unknown): string {
    // Sort keys to ensure {a:1, b:2} matches {b:2, a:1}
    const serialize = (obj: any): string => {
      if (obj === null || typeof obj !== 'object') return String(obj);
      return JSON.stringify(Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {} as any));
    };

    return `${method}:${url}:${serialize(params)}:${serialize(query)}`;
  }

  set(key: string, value: any, ttlMs: number) {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value as T;
  }
  
  clear() {
    this.cache.clear();
  }
}
