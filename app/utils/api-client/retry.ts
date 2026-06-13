/**
 * Executes a promise-returning function with exponential backoff retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: unknown;
  
  // attempt 0 is the initial try, up to attempts
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If we haven't reached max attempts, delay and retry
      if (i < attempts) {
        // Exponential backoff: baseDelayMs * 2^i
        const delay = baseDelayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
