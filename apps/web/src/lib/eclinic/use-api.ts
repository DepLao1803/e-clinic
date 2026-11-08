'use client'

import { DependencyList, useCallback, useEffect, useRef, useState } from 'react'
import { errMsg } from './api'

/**
 * Load data when the page mounts (and whenever `deps` change). `reload()` refetches without
 * blanking the screen, so tables don't flicker after an action.
 */
export function useApi<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let alive = true
    setError(null)
    loaderRef
      .current()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(errMsg(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}

/** Run a mutation with busy/error state. Resolves true on success. */
export function useAction(onDone?: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onDone?.()
      return true
    } catch (e) {
      setError(errMsg(e))
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}
