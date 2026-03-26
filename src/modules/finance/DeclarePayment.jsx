import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCreditCard,
  cilWarning,
  cilCheckCircle,
  cilArrowLeft,
} from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
]

const DeclarePayment = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [debts, setDebts] = useState([])
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/finance/debts', {
        params: { limit: 100 },
      })
      setDebts(response.data?.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load unsettled orders.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  const toggleOrder = (orderId) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedOrders.size === debts.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(debts.map((o) => o.id)))
    }
  }

  const selectedTotal = debts
    .filter((o) => selectedOrders.has(o.id))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedOrders.size === 0) {
      setError('Please select at least one order to cover.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        orderIds: Array.from(selectedOrders),
        method,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }

      await api.post('/finance/settlements', payload)
      setSuccess(
        `Payment declaration submitted for $${selectedTotal.toFixed(2)} covering ${selectedOrders.size} order(s). Pending validation.`,
      )
      setSelectedOrders(new Set())
      setReference('')
      setNote('')

      // Refresh debts list
      fetchDebts()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to submit payment declaration.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Declare Payment"
        subtitle="Select delivered orders and declare your payment."
        actions={
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => navigate('/finance')}
          >
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back to Finance
          </CButton>
        }
      />

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}
      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess('')}>
          <CIcon icon={cilCheckCircle} className="me-1" />
          {success}
        </CAlert>
      )}

      <form onSubmit={handleSubmit}>
        <CRow>
          {/* ── Order Selection ─────────────────────────────────── */}
          <CCol lg={8} className="mb-4">
            <CCard>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>
                  Select Orders to Settle{' '}
                  <CBadge
                    color="info"
                    shape="rounded-pill"
                    className="ms-1"
                  >
                    {debts.length} available
                  </CBadge>
                </strong>
                <CButton
                  type="button"
                  color="link"
                  size="sm"
                  onClick={selectAll}
                >
                  {selectedOrders.size === debts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </CButton>
              </CCardHeader>
              <CCardBody className="p-0">
                {debts.length === 0 ? (
                  <div className="text-center text-medium-emphasis py-4">
                    No delivered orders available for settlement.
                  </div>
                ) : (
                  <CTable hover responsive align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: 40 }}>
                          <CFormCheck
                            checked={
                              debts.length > 0 &&
                              selectedOrders.size === debts.length
                            }
                            onChange={selectAll}
                          />
                        </CTableHeaderCell>
                        <CTableHeaderCell>Order</CTableHeaderCell>
                        <CTableHeaderCell>Customer</CTableHeaderCell>
                        <CTableHeaderCell>Amount</CTableHeaderCell>
                        <CTableHeaderCell>Delivered</CTableHeaderCell>
                        <CTableHeaderCell>Days</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {debts.map((o) => {
                        const isSelected = selectedOrders.has(o.id)
                        return (
                          <CTableRow
                            key={o.id}
                            style={{
                              cursor: 'pointer',
                              background: isSelected
                                ? 'rgba(var(--cui-primary-rgb), 0.05)'
                                : undefined,
                            }}
                            onClick={() => toggleOrder(o.id)}
                          >
                            <CTableDataCell>
                              <CFormCheck
                                checked={isSelected}
                                onChange={() => toggleOrder(o.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </CTableDataCell>
                            <CTableDataCell
                              className="text-truncate fw-semibold"
                              style={{
                                maxWidth: 120,
                                fontFamily:
                                  "'JetBrains Mono', monospace",
                                fontSize: '0.82rem',
                              }}
                            >
                              #{o.id?.slice(0, 8)}…
                            </CTableDataCell>
                            <CTableDataCell>
                              {o.userEmail || '—'}
                            </CTableDataCell>
                            <CTableDataCell
                              style={{
                                fontFamily:
                                  "'JetBrains Mono', monospace",
                                fontSize: '0.85rem',
                                fontWeight: 600,
                              }}
                            >
                              ${(o.totalAmount || 0).toFixed(2)}
                            </CTableDataCell>
                            <CTableDataCell className="text-medium-emphasis small">
                              {o.deliveredAt
                                ? new Date(
                                    o.deliveredAt,
                                  ).toLocaleDateString()
                                : '—'}
                            </CTableDataCell>
                            <CTableDataCell>
                              <span
                                style={{
                                  color: o.isOverdue
                                    ? '#dc3545'
                                    : 'inherit',
                                  fontWeight: o.isOverdue ? 700 : 400,
                                }}
                              >
                                {o.daysSinceDelivery}d
                                {o.isOverdue && (
                                  <CIcon
                                    icon={cilWarning}
                                    size="sm"
                                    className="ms-1"
                                    style={{ color: '#dc3545' }}
                                  />
                                )}
                              </span>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                )}
              </CCardBody>
            </CCard>
          </CCol>

          {/* ── Payment Details ─────────────────────────────────── */}
          <CCol lg={4} className="mb-4">
            <CCard className="sticky-top" style={{ top: '1rem' }}>
              <CCardHeader>
                <strong>Payment Details</strong>
              </CCardHeader>
              <CCardBody>
                {/* Summary */}
                <div
                  className="p-3 mb-3 rounded"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(var(--cui-primary-rgb), 0.08), rgba(var(--cui-success-rgb), 0.08))',
                  }}
                >
                  <div
                    className="text-medium-emphasis mb-1"
                    style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
                  >
                    Total to Settle
                  </div>
                  <div
                    className="fw-bold"
                    style={{
                      fontSize: '1.8rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--cui-primary)',
                    }}
                  >
                    ${selectedTotal.toFixed(2)}
                  </div>
                  <div className="text-medium-emphasis" style={{ fontSize: '0.8rem' }}>
                    {selectedOrders.size} order
                    {selectedOrders.size !== 1 ? 's' : ''} selected
                  </div>
                </div>

                {/* Method */}
                <div className="mb-3">
                  <CFormLabel className="fw-semibold">
                    Payment Method *
                  </CFormLabel>
                  <CFormSelect
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </CFormSelect>
                </div>

                {/* Reference */}
                <div className="mb-3">
                  <CFormLabel className="fw-semibold">
                    Payment Reference
                  </CFormLabel>
                  <CFormInput
                    placeholder="e.g. VIR-2026-03-25-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                  <div
                    className="text-medium-emphasis mt-1"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Bank transfer ref, check number, etc.
                  </div>
                </div>

                {/* Note */}
                <div className="mb-3">
                  <CFormLabel className="fw-semibold">Note</CFormLabel>
                  <CFormTextarea
                    rows={2}
                    placeholder="Optional note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {/* Submit */}
                <CButton
                  type="submit"
                  color="primary"
                  className="w-100"
                  size="lg"
                  disabled={submitting || selectedOrders.size === 0}
                >
                  {submitting ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilCreditCard} className="me-2" />
                      Declare Payment (${selectedTotal.toFixed(2)})
                    </>
                  )}
                </CButton>

                <div
                  className="text-center text-medium-emphasis mt-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  Your declaration will be submitted for validation.
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </form>
    </div>
  )
}

export default DeclarePayment
