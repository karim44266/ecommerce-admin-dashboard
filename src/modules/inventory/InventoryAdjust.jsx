import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilCheckCircle,
  cilXCircle,
  cilPencil,
  cilPlus,
} from '@coreui/icons'
import useInventoryApi from '../../shared/hooks/useInventoryApi'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import TruncatedPagination from '../../shared/components/TruncatedPagination'
import { formatCurrency } from '../../shared/utils/formatters'

const InventoryAdjust = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const {
    fetchProduct,
    fetchHistory,
    adjustStock,
    updateThreshold: apiUpdateThreshold,
  } = useInventoryApi()

  const [inventory, setInventory] = useState(null)
  const [history, setHistory] = useState([])
  const [historyMeta, setHistoryMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [historyPage, setHistoryPage] = useState(1)
  const [adjustment, setAdjustment] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)

  // Threshold editing
  const [editingThreshold, setEditingThreshold] = useState(false)
  const [newThreshold, setNewThreshold] = useState('')
  const [thresholdSaving, setThresholdSaving] = useState(false)

  // Quick-adjust mode: accumulate vs. set
  const [accumulateMode, setAccumulateMode] = useState(false)

  // ── Load product + history ──
  const loadData = useCallback(
    async (hPage = 1) => {
      setLoading(true)
      const [invRes, histRes] = await Promise.all([
        fetchProduct(productId),
        fetchHistory(productId, { page: hPage, limit: 10 }),
      ])

      if (invRes?.data) setInventory(invRes.data)
      else setError('Unable to load inventory data.')

      if (histRes?.data) {
        const histData = histRes.data?.data || histRes.data || []
        const hMeta = histRes.data?.meta || { total: histData.length, page: 1, limit: 10, totalPages: 1 }
        setHistory(histData)
        setHistoryMeta(hMeta)
      }
      setLoading(false)
    },
    [productId, fetchProduct, fetchHistory],
  )

  // ── Load history only (for page changes) ──
  const loadHistory = useCallback(
    async (hPage) => {
      const histRes = await fetchHistory(productId, { page: hPage, limit: 10 })
      if (histRes?.data) {
        const histData = histRes.data?.data || histRes.data || []
        const hMeta = histRes.data?.meta || { total: histData.length, page: 1, limit: 10, totalPages: 1 }
        setHistory(histData)
        setHistoryMeta(hMeta)
      }
    },
    [productId, fetchHistory],
  )

  // Initial load
  useEffect(() => {
    loadData(1)
  }, [loadData])

  // History page change — only refetch history, not the full data
  const handleHistoryPageChange = useCallback(
    (newPage) => {
      setHistoryPage(newPage)
      loadHistory(newPage)
    },
    [loadHistory],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    const adjValue = parseInt(adjustment, 10)
    if (isNaN(adjValue) || adjValue === 0) {
      setError('Adjustment must be a non-zero integer.')
      return
    }

    if (adjValue > 0 && purchasePrice === '') {
      setError('Purchase price is required when adding stock.')
      return
    }

    if (purchasePrice !== '') {
      const parsedPurchasePrice = Number(purchasePrice)
      if (Number.isNaN(parsedPurchasePrice) || parsedPurchasePrice <= 0) {
        setError('Purchase price must be greater than 0 when provided.')
        return
      }
    }

    // Show confirmation dialog
    setConfirmVisible(true)
  }

  const executeAdjustment = async () => {
    setConfirmVisible(false)
    setSubmitting(true)
    setError('')
    setSuccess('')

    const adjValue = parseInt(adjustment, 10)
    const payload = { adjustment: adjValue }
    if (reason.trim()) payload.reason = reason.trim()
    if (purchasePrice !== '') payload.purchasePrice = Number(purchasePrice)

    const res = await adjustStock(productId, payload)
    if (res?.data) {
      setSuccess(
        `Stock ${adjValue > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjValue)} units${purchasePrice !== '' ? ' with purchase price recorded' : ''}.`,
      )
      setAdjustment('')
      setPurchasePrice('')
      setReason('')
      setHistoryPage(1)
      loadData(1)
    } else {
      setError('Unable to adjust stock.')
    }
    setSubmitting(false)
  }

  const handleThresholdSave = async () => {
    const val = parseInt(newThreshold, 10)
    if (isNaN(val) || val < 0) {
      setError('Threshold must be a non-negative integer.')
      return
    }
    setThresholdSaving(true)
    setError('')
    const res = await apiUpdateThreshold(productId, val)
    if (res?.data) {
      setEditingThreshold(false)
      loadData(historyPage)
    }
    setThresholdSaving(false)
  }

  // ── Quick-adjust handler — accumulate or set ──
  const handleQuickAdjust = (value) => {
    if (accumulateMode) {
      const current = parseInt(adjustment, 10) || 0
      const newVal = current + value
      // Prevent setting to 0 (invalid adjustment)
      setAdjustment(String(newVal === 0 ? value : newVal))
    } else {
      setAdjustment(String(value))
    }
  }

  if (loading && !inventory) {
    return <p className="text-center py-5">Loading...</p>
  }

  const adjValue = parseInt(adjustment, 10)
  const previewQty = inventory && !isNaN(adjValue) ? inventory.quantity + adjValue : null

  return (
    <div>
      <PageHeader
        title="Adjust Inventory"
        subtitle={inventory ? `${inventory.productName} (${inventory.productSku})` : ''}
        actions={
          <div className="nx-utility-actions">
            <CButton color="secondary" className="nx-utility-btn" onClick={() => navigate('/inventory')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Inventory
            </CButton>
          </div>
        }
      />

      {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
      {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}

      {/* Current Stock Info */}
      {inventory && (
        <CCard className="mb-4">
          <CCardBody>
            <CRow>
              <CCol md={3}>
                <strong>Current Stock</strong>
                <h3 className="mt-1">{inventory.quantity}</h3>
              </CCol>
              <CCol md={3}>
                <strong>Current Price</strong>
                <h3 className="mt-1">{formatCurrency(inventory.currentPrice)}</h3>
              </CCol>
              <CCol md={3}>
                <strong>Current Cost</strong>
                <h3 className="mt-1">{formatCurrency(inventory.currentCostPrice)}</h3>
              </CCol>
              <CCol md={3}>
                <strong>Low Stock Threshold</strong>
                {editingThreshold ? (
                  <div className="d-flex gap-1 mt-1">
                    <CFormInput
                      type="number"
                      min="0"
                      size="sm"
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(e.target.value)}
                      style={{ width: '80px' }}
                    />
                    <CButton color="success" size="sm" onClick={handleThresholdSave} disabled={thresholdSaving}>
                      <CIcon icon={cilCheckCircle} className="me-1" />
                      {thresholdSaving ? '...' : 'Save'}
                    </CButton>
                    <CButton color="secondary" size="sm" onClick={() => setEditingThreshold(false)}>
                      <CIcon icon={cilXCircle} className="me-1" />
                      Cancel
                    </CButton>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <h3 className="mb-0">{inventory.lowStockThreshold}</h3>
                    <CButton
                      color="light"
                      size="sm"
                      onClick={() => {
                        setNewThreshold(String(inventory.lowStockThreshold))
                        setEditingThreshold(true)
                      }}
                    >
                      <CIcon icon={cilPencil} className="me-1" />
                      Edit
                    </CButton>
                  </div>
                )}
              </CCol>
              <CCol md={3}>
                <strong>Status</strong>
                <div className="mt-2">
                  {inventory.quantity <= 0 ? (
                    <CBadge color="danger" className="fs-6">Out of Stock</CBadge>
                  ) : inventory.isLowStock ? (
                    <CBadge color="warning" className="fs-6">Low Stock</CBadge>
                  ) : (
                    <CBadge color="success" className="fs-6">In Stock</CBadge>
                  )}
                </div>
              </CCol>
              <CCol md={3}>
                <strong>Product Status</strong>
                <div className="mt-2">
                  <CBadge
                    color={
                      inventory.productStatus === 'active'
                        ? 'success'
                        : inventory.productStatus === 'draft'
                          ? 'warning'
                          : 'secondary'
                    }
                    className="fs-6"
                  >
                    {inventory.productStatus}
                  </CBadge>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      )}

      {/* Adjustment Form */}
      <FormCard
        title="Make Adjustment"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              <CIcon icon={cilPencil} className="me-1" />
              {submitting ? 'Adjusting...' : 'Apply Adjustment'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate('/inventory')}>
              <CIcon icon={cilXCircle} className="me-1" />
              Cancel
            </CButton>
          </>
        }
      >
        <CRow>
          <CCol md={6}>
            <div className="mb-3">
              <CFormLabel>Adjustment (positive to add, negative to remove)</CFormLabel>
              <CFormInput
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="e.g. 25 or -5"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Purchase Price (required when adding stock)</CFormLabel>
              <CFormInput
                type="number"
                min="0.01"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder={`Current avg cost: ${formatCurrency(inventory?.currentCostPrice)}`}
              />
            </div>
          </CCol>
          <CCol md={6}>
            {/* Quick adjustment buttons */}
            <CFormLabel>Quick Adjust</CFormLabel>
            <div className="d-flex gap-1 flex-wrap mt-1 mb-2">
              {[+1, +10, +50, +100, -1, -5, -10].map((v) => (
                <CButton
                  key={v}
                  color={v > 0 ? 'success' : 'danger'}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(v)}
                >
                  <CIcon icon={v > 0 ? cilPlus : cilXCircle} className="me-1" />
                  {v > 0 ? `+${v}` : v}
                </CButton>
              ))}
            </div>
            <CFormCheck
              id="accumulate-toggle"
              label="Accumulate mode (add to current value)"
              checked={accumulateMode}
              onChange={(e) => setAccumulateMode(e.target.checked)}
            />
          </CCol>
        </CRow>
        <div className="mb-3">
          <CFormLabel>Reason (optional)</CFormLabel>
          <CFormTextarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Restock from supplier, Damaged goods..."
          />
        </div>
        {previewQty !== null && !isNaN(adjValue) && adjValue !== 0 && (
          <CAlert color={previewQty < 0 ? 'danger' : previewQty <= (inventory?.lowStockThreshold || 10) ? 'warning' : 'info'}>
            Preview: {inventory?.quantity} → <strong>{previewQty}</strong>
            {previewQty < 0 && ' (will be rejected — cannot go below 0)'}
          </CAlert>
        )}
      </FormCard>

      {/* Confirmation Modal */}
      <CModal visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Adjustment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            You are about to{' '}
            <strong>{adjValue > 0 ? 'add' : 'remove'} {Math.abs(adjValue || 0)}</strong> unit(s).
          </p>
          <p>
            Stock will change from <strong>{inventory?.quantity}</strong> to{' '}
            <strong>{previewQty}</strong>.
          </p>
          {purchasePrice !== '' && (
            <p>
              Purchase price for this stock: <strong>{formatCurrency(purchasePrice)}</strong>.
            </p>
          )}
          {reason && <p>Reason: <em>{reason}</em></p>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmVisible(false)}>
            <CIcon icon={cilXCircle} className="me-1" />
            Cancel
          </CButton>
          <CButton color="primary" onClick={executeAdjustment}>
            <CIcon icon={cilCheckCircle} className="me-1" />
            Confirm
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Adjustment History */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span>Adjustment History</span>
          <small className="text-medium-emphasis">{historyMeta.total} total entries</small>
        </CCardHeader>
        {history.length === 0 ? (
          <div className="p-4">
            <p className="text-medium-emphasis text-center mb-0">No adjustments recorded yet.</p>
          </div>
        ) : (
          <>
            <CTable responsive hover align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Adjustment</CTableHeaderCell>
                    <CTableHeaderCell>Purchase Price</CTableHeaderCell>
                    <CTableHeaderCell>Cost Basis</CTableHeaderCell>
                    <CTableHeaderCell>Reason</CTableHeaderCell>
                    <CTableHeaderCell>By</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {history.map((entry) => (
                    <CTableRow key={entry.id}>
                      <CTableDataCell>
                        {new Date(entry.createdAt).toLocaleString()}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={entry.adjustment > 0 ? 'success' : 'danger'}>
                          {entry.adjustment > 0 ? `+${entry.adjustment}` : entry.adjustment}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {entry.purchasePrice != null
                          ? formatCurrency(entry.purchasePrice)
                          : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {entry.previousCostPrice != null && entry.newCostPrice != null
                          ? `${formatCurrency(entry.previousCostPrice)} -> ${formatCurrency(entry.newCostPrice)}`
                          : '—'}
                      </CTableDataCell>
                      <CTableDataCell>{entry.reason || '—'}</CTableDataCell>
                      <CTableDataCell>{entry.adjustedBy || '—'}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
            </CTable>
            <div className="p-3">
              <TruncatedPagination
                page={historyPage}
                totalPages={historyMeta.totalPages}
                onPageChange={handleHistoryPageChange}
                size="sm"
              />
            </div>
          </>
        )}
      </CCard>
    </div>
  )
}

export default InventoryAdjust
