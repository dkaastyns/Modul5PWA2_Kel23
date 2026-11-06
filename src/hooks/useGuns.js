import { useState, useEffect, useCallback, useRef } from 'react'
import gunService from '../services/gunService'
import queryCache from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API
// with Query Caching & Stale-While-Revalidate (SWR) support.
//
// Returns { guns, loading, error, pagination, isStale, refetch }.
// ---------------------------------------------------------------------------

export function useGuns(params = {}, options = {}) {
  const { ttl = 5 * 60 * 1000 } = options // default cache TTL: 5 minutes
  const cacheKey = queryCache.generateKey('guns', params)

  // Initialize with cached data if available (instant load)
  const cachedInitial = queryCache.get(cacheKey)
  const [guns, setGuns] = useState(cachedInitial ? cachedInitial.data : [])
  const [loading, setLoading] = useState(!cachedInitial)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(cachedInitial ? cachedInitial.pagination : null)
  const isMounted = useRef(true)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(async (bypassCache = false) => {
    const currentKey = queryCache.generateKey('guns', params)

    if (!bypassCache) {
      const cached = queryCache.get(currentKey)
      if (cached) {
        setGuns(cached.data || [])
        setPagination(cached.pagination || null)
        setLoading(false)
        setError(null)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGuns(params)

      if (!isMounted.current) return

      if (response.success) {
        const fetchedData = response.data || []
        const fetchedPagination = response.pagination || null

        // Store into cache
        queryCache.set(currentKey, {
          data: fetchedData,
          pagination: fetchedPagination,
        }, ttl)

        setGuns(fetchedData)
        setPagination(fetchedPagination)
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      if (!isMounted.current) return
      setError(err.message || 'An error occurred while fetching products.')
      // If we already had cached data, keep displaying it rather than blanking out
      if (!queryCache.get(currentKey)) {
        setGuns([])
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, ttl])

  useEffect(() => {
    isMounted.current = true
    fetchGuns(false)
    return () => {
      isMounted.current = false
    }
  }, [fetchGuns])

  const refetch = useCallback(() => {
    return fetchGuns(true)
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID/ID with query caching.
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id, options = {}) {
  const { ttl = 5 * 60 * 1000 } = options
  const cacheKey = id ? `gun:${id}` : null
  const cachedInitial = cacheKey ? queryCache.get(cacheKey) : null

  const [gun, setGun] = useState(cachedInitial || null)
  const [loading, setLoading] = useState(Boolean(id) && !cachedInitial)
  const [error, setError] = useState(null)
  const isMounted = useRef(true)

  const fetchGun = useCallback(async (bypassCache = false) => {
    if (!id) {
      setLoading(false)
      return
    }

    const currentKey = `gun:${id}`

    if (!bypassCache) {
      const cached = queryCache.get(currentKey)
      if (cached) {
        setGun(cached)
        setLoading(false)
        setError(null)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id)

      if (!isMounted.current) return

      if (response.success) {
        queryCache.set(currentKey, response.data, ttl)
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      if (!isMounted.current) return
      setError(err.message || 'Failed to load product details.')
      if (!queryCache.get(currentKey)) {
        setGun(null)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [id, ttl])

  useEffect(() => {
    isMounted.current = true
    fetchGun(false)
    return () => {
      isMounted.current = false
    }
  }, [fetchGun])

  const refetch = useCallback(() => {
    return fetchGun(true)
  }, [fetchGun])

  return { gun, loading, error, refetch }
}
