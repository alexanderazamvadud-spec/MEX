import { useEffect, useState } from 'react'
import { loadPack } from './index.ts'
import type { ContentPack, PathwayId } from './types.ts'

export interface PackResult {
  /** The loaded pack, or null while it loads, after a failure, or when no pathway is given. */
  pack: ContentPack | null
  /** True when loading failed (for example, the connection dropped); screens then show ContentLoadError. */
  failed: boolean
}

// Loads a pathway's content pack on demand and reports a failed load (MVP-17).
export function usePackResult(pathway: PathwayId | null): PackResult {
  const [loaded, setLoaded] = useState<{ pathway: PathwayId; pack: ContentPack | null } | null>(null)

  useEffect(() => {
    if (!pathway) return
    let active = true
    loadPack(pathway)
      .then((pack) => {
        if (active) setLoaded({ pathway, pack })
      })
      .catch((error: unknown) => {
        console.error(`MEX could not load the content for "${pathway}".`, error)
        if (active) setLoaded({ pathway, pack: null })
      })
    return () => {
      active = false
    }
  }, [pathway])

  const current = pathway && loaded?.pathway === pathway ? loaded : null
  return { pack: current?.pack ?? null, failed: current !== null && current.pack === null }
}
