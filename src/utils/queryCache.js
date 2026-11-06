/**
 * In-memory Query Cache with Time-To-Live (TTL) & prefix invalidation.
 * Helps prevent redundant network fetches across components and tab switches.
 */

class QueryCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // default 5 minutes
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  /**
   * Produce a deterministic cache key from a namespace and parameters.
   */
  generateKey(namespace, params = {}) {
    const sortedEntries = Object.entries(params)
      .filter(([, val]) => val !== undefined && val !== null && val !== '')
      .sort(([a], [b]) => a.localeCompare(b))
    return `${namespace}:${JSON.stringify(sortedEntries)}`
  }

  /**
   * Get cached data if available and not expired.
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cached data with a TTL in milliseconds.
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    })
  }

  /**
   * Invalidate all keys matching a namespace or prefix.
   * Useful when mutations (Create, Update, Delete) occur.
   */
  invalidate(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cached queries.
   */
  clear() {
    this.cache.clear()
  }
}

export const queryCache = new QueryCache()
export default queryCache
