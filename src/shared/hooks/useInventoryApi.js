import { useCallback, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../components/ToastProvider'

/**
 * Shared hook encapsulating inventory API calls and common loading/error state.
 */
const useInventoryApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const clearError = useCallback(() => setError(''), [])

  const wrapRequest = useCallback(
    async (fn, { successMessage, errorMessage } = {}) => {
      setLoading(true)
      setError('')
      try {
        const result = await fn()
        if (successMessage) addToast(successMessage, 'success')
        return result
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          errorMessage ||
          'An error occurred'
        const formatted = Array.isArray(msg) ? msg.join(', ') : msg
        setError(formatted)
        addToast(formatted, 'danger')
        return null
      } finally {
        setLoading(false)
      }
    },
    [addToast],
  )

  // ── Inventory list (paginated) ──
  const fetchInventory = useCallback(
    (params) =>
      wrapRequest(() => api.get('/inventory', { params }), {
        errorMessage: 'Unable to load inventory.',
      }),
    [wrapRequest],
  )

  // ── Summary counts ──
  const fetchSummary = useCallback(
    () =>
      wrapRequest(() => api.get('/inventory/summary'), {
        errorMessage: 'Unable to load summary.',
      }),
    [wrapRequest],
  )

  // ── Low stock (paginated) ──
  const fetchLowStock = useCallback(
    (params) =>
      wrapRequest(() => api.get('/inventory/low-stock', { params }), {
        errorMessage: 'Unable to load low stock items.',
      }),
    [wrapRequest],
  )

  // ── Single product inventory ──
  const fetchProduct = useCallback(
    (productId) =>
      wrapRequest(() => api.get(`/inventory/${productId}`), {
        errorMessage: 'Unable to load inventory data.',
      }),
    [wrapRequest],
  )

  // ── History (paginated) ──
  const fetchHistory = useCallback(
    (productId, params) =>
      wrapRequest(() => api.get(`/inventory/${productId}/history`, { params }), {
        errorMessage: 'Unable to load history.',
      }),
    [wrapRequest],
  )

  // ── Adjust stock ──
  const adjustStock = useCallback(
    (productId, payload) =>
      wrapRequest(() => api.post(`/inventory/${productId}/adjust`, payload), {
        successMessage: `Stock ${payload.adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(payload.adjustment)} units.`,
        errorMessage: 'Unable to adjust stock.',
      }),
    [wrapRequest],
  )

  // ── Update threshold ──
  const updateThreshold = useCallback(
    (productId, lowStockThreshold) =>
      wrapRequest(
        () => api.patch(`/inventory/${productId}/threshold`, { lowStockThreshold }),
        {
          successMessage: `Threshold updated to ${lowStockThreshold}.`,
          errorMessage: 'Unable to update threshold.',
        },
      ),
    [wrapRequest],
  )

  // ── Backfill ──
  const backfill = useCallback(
    () =>
      wrapRequest(() => api.post('/inventory/backfill'), {
        errorMessage: 'Backfill failed.',
      }),
    [wrapRequest],
  )

  return {
    loading,
    error,
    clearError,
    fetchInventory,
    fetchSummary,
    fetchLowStock,
    fetchProduct,
    fetchHistory,
    adjustStock,
    updateThreshold,
    backfill,
  }
}

export default useInventoryApi
