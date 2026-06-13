/**
 * Token bucket implementation for rate limiting requests on the client side.
 */
export class RateLimiter {
  private endpoints = new Map<string, { tokens: number; lastRefill: number }>();

  /**
   * Returns true if the request is allowed, false if it should be rate limited.
   */
  checkLimit(endpointPath: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const state = this.endpoints.get(endpointPath) || { tokens: maxRequests, lastRefill: now };

    // Refill tokens if the time window has passed
    if (now - state.lastRefill >= windowMs) {
      state.tokens = maxRequests;
      state.lastRefill = now;
    }

    if (state.tokens > 0) {
      state.tokens -= 1;
      this.endpoints.set(endpointPath, state);
      return true; // Request allowed
    }

    return false; // Rate limited
  }

  clear() {
    this.endpoints.clear();
  }
}
