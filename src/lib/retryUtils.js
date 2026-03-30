/**
 * Retry utility with exponential backoff + in-memory cache
 */

const _cache = new Map();

/**
 * Retry a fn up to `attempts` times with exponential backoff
 * @param {Function} fn - async function to retry
 * @param {number} attempts - max attempts
 * @param {number} baseDelay - base delay in ms
 */
export async function withRetry(fn, attempts = 3, baseDelay = 300) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

/**
 * Cache result of fn for `ttlMs` milliseconds
 * @param {string} key
 * @param {Function} fn
 * @param {number} ttlMs
 */
export async function withCache(key, fn, ttlMs = 60_000) {
  const cached = _cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  const value = await fn();
  _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/**
 * Debounce a function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Validate a ticker string — returns normalized or null
 */
export function normalizeTicker(raw) {
  if (!raw) return null;
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9.\-:]/g, '');
  return t.length >= 1 && t.length <= 10 ? t : null;
}

/**
 * Build verified finance links with fallbacks
 */
export function buildTickerLinks(ticker) {
  const t = normalizeTicker(ticker);
  if (!t) return [];
  return [
    `https://finance.yahoo.com/quote/${t}`,
    `https://www.google.com/finance/quote/${t}`,
    `https://www.tradingview.com/symbols/${t}`,
  ];
}

/**
 * Simple AI output validator — checks for empty/null/malformed
 */
export function validateAIResponse(response, schema = {}) {
  if (!response) return { valid: false, reason: 'null/empty response' };
  if (schema.requiredFields) {
    for (const field of schema.requiredFields) {
      if (!response[field]) return { valid: false, reason: `missing field: ${field}` };
    }
  }
  if (schema.type === 'array' && !Array.isArray(response)) {
    return { valid: false, reason: 'expected array' };
  }
  return { valid: true };
}

export default { withRetry, withCache, debounce, normalizeTicker, buildTickerLinks, validateAIResponse };