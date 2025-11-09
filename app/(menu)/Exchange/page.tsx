// File: app/(menu)/Exchange/page.tsx
'use client'

import React, { useEffect } from 'react'
import Component from './index'

function ExchangePage() {
  // Lazily install the document-click probe only when debug flags are on.
  useEffect(() => {
    const DBG =
      typeof window !== 'undefined' &&
      (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
        process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true')

    if (!DBG) return

    let cleanup: (() => void) | undefined

    ;(async () => {
      try {
        const mod = await import('@/lib/debug/panels/installDocClickProbe')
        // If the module exists and exports a function, call it.
        // If it returns a cleanup, keep it for unmount.
        if (typeof mod.installDocClickProbe === 'function') {
          cleanup = mod.installDocClickProbe()
        }
      } catch {
        // Probe is optional; ignore if absent in certain builds.
      }
    })()

    return () => {
      try {
        cleanup?.()
      } catch {
        // no-op
      }
    }
  }, [])

  return <Component />
}

export default ExchangePage
