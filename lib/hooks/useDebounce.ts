import { useEffect, useState } from 'react'

const defaultMilliSeconds = 600
let isDebug:boolean = process.env.NEXT_PUBLIC_DEBUG_DEBOUNCE === 'true'
isDebug = false;

/**
 * Debounce hook with optional debug logging.
 */
export const useDebounce = <T>(value: T, delay: number = defaultMilliSeconds): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    if (isDebug) {
      console.log(`[⏳ useDebounce] Waiting ${delay}ms for:`, value)
    }

    const timeout = setTimeout(() => {
      setDebouncedValue(value)
      if (isDebug) {
        console.log(`[✅ useDebounce] Debounced value set:`, value)
      }
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (isDebug) {
        console.log(`[❌ useDebounce] Cleared previous timeout for:`, value)
      }
    }
  }, [value, delay])

  return debouncedValue
}
