// File: app/(menu)/Exchange/page.tsx
'use client'

import React, { useEffect } from 'react'
import Component from './index'

export default function ExchangePage() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    ;(async () => {
      try {
        const mod = await import('@/lib/debug/panels/installDocClickProbe')
        if (typeof mod.installDocClickProbe === 'function') {
          const ret = mod.installDocClickProbe()
          if (typeof ret === 'function') cleanup = ret
        }
      } catch {
        // Probe is optional; ignore if it doesn't exist in this build
      }
    })()

    return () => {
      if (typeof cleanup === 'function') {
        try { cleanup() } catch {}
      }
    }
  }, [])

  return <Component />
}
