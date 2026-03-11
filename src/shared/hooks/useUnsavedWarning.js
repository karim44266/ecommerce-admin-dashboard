import { useEffect, useCallback } from 'react'

/**
 * Warns the user via the browser's beforeunload event when there are unsaved
 * form changes.  Pass `dirty = true` when the form has been modified.
 *
 * Usage:
 *   const dirty = name !== '' || sku !== ''
 *   useUnsavedWarning(dirty)
 */
export default function useUnsavedWarning(dirty) {
  const handler = useCallback(
    (e) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    },
    [dirty],
  )

  useEffect(() => {
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [handler])
}
