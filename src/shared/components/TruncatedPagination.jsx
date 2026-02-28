import React from 'react'
import { CPagination, CPaginationItem } from '@coreui/react'

/**
 * Truncated pagination that shows first, last, and a window around the current page.
 * Example with page=5, totalPages=20:  « 1 … 4 5 6 … 20 »
 */
const TruncatedPagination = ({ page, totalPages, onPageChange, size = '' }) => {
  if (totalPages <= 1) return null

  const windowSize = 1 // pages on each side of current

  const buildPages = () => {
    const pages = new Set()

    // Always include first and last
    pages.add(1)
    pages.add(totalPages)

    // Window around current page
    for (let i = page - windowSize; i <= page + windowSize; i++) {
      if (i >= 1 && i <= totalPages) pages.add(i)
    }

    const sorted = [...pages].sort((a, b) => a - b)

    // Insert ellipsis markers
    const result = []
    let prev = 0
    for (const p of sorted) {
      if (p - prev > 1) {
        result.push({ type: 'ellipsis', key: `e${p}` })
      }
      result.push({ type: 'page', value: p, key: `p${p}` })
      prev = p
    }
    return result
  }

  return (
    <CPagination className="mt-3 justify-content-center" size={size || undefined}>
      <CPaginationItem disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </CPaginationItem>
      {buildPages().map((item) =>
        item.type === 'ellipsis' ? (
          <CPaginationItem key={item.key} disabled>
            …
          </CPaginationItem>
        ) : (
          <CPaginationItem
            key={item.key}
            active={item.value === page}
            onClick={() => onPageChange(item.value)}
          >
            {item.value}
          </CPaginationItem>
        ),
      )}
      <CPaginationItem disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </CPaginationItem>
    </CPagination>
  )
}

export default TruncatedPagination
