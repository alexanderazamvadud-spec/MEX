import { useEffect, useState } from 'react'
import { loadPack } from './index.ts'
import type { ContentPack, PathwayId } from './types.ts'

// Loads a pathway's content pack on demand. Returns null while it loads (and if loading
// fails; a visible message for that is a separate roadmap task) and when no pathway is given.
export function usePack(pathway: PathwayId | null): ContentPack | null {
  const [loaded, setLoaded] = useState<{ pathway: PathwayId; pack: ContentPack } | null>(null)

  useEffect(() => {
    if (!pathway) return
    let active = true
    loadPack(pathway)
      .then((pack) => {
        if (active) setLoaded({ pathway, pack })
      })
      .catch((error: unknown) => {
        console.error(`MEX could not load the content for "${pathway}".`, error)
      })
    return () => {
      active = false
    }
  }, [pathway])

  return pathway && loaded?.pathway === pathway ? loaded.pack : null
}
