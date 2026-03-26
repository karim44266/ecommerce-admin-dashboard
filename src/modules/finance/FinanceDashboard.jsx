import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilDollar,
  cilCheckCircle,
  cilWarning,
  cilCloudDownload,
  cilCreditCard,
  cilArrowRight,
  cilHistory,
  cilChart,
} from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'

const OVERDUE_COLOR = '#dc3545'
const BADGE_STYLES = {
  DELIVERED: 'warning',
  SETTLED: 'success',
}

const FinanceDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [debts, setDebts] = useState([])
  const [overdueOrders, setOverdueOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [dashRes, debtsRes, overdueRes] = await Promise.all([
          api.get('/finance/dashboard'),
          api.get('/finance/debts', { params: { limit: 5 } }),
          api.get('/finance/overdue'),
        ])
        setDashboard(dashRes.data)
        setDebts(debtsRes.data?.data || [])
        setOverdueOrders(overdueRes.data?.orders || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load financial data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <CAlert color="danger">
        {error || 'Unable to load financial dashboard.'}
      </CAlert>
    )
  }

  const kpiCards = [
    {
      label: 'Total Owed',
      value: `$${dashboard.totalOwed?.toFixed(2) ?? '0.00'}`,
      subtitle: `${dashboard.deliveredCount ?? 0} delivered orders`,
      icon: cilDollar,
      variant: '--warning',
    },
    {
      label: 'Total Settled',
      value: `$${dashboard.totalSettled?.toFixed(2) ?? '0.00'}`,
      subtitle: `${dashboard.settledCount ?? 0} settled orders`,
      icon: cilCheckCircle,
      variant: '--success',
    },
    {
      label: 'Estimated Margin',
      value: `$${dashboard.estimatedMargin?.toFixed(2) ?? '0.00'}`,
      subtitle: '20% discount savings',
      icon: cilChart,
      variant: '--info',
    },
    {
      label: 'Overdue',
      value: dashboard.overdueCount ?? 0,
      subtitle: `> ${dashboard.overdueDays ?? 7} days unsettled`,
      icon: cilWarning,
      variant: dashboard.overdueCount > 0 ? '--danger' : '--secondary',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Financial Overview"
        subtitle="Track your balance, debts, and settlements."
        actions={
          <div className="d-flex gap-2">
            <CButton
              color="primary"
              onClick={() => navigate('/finance/declare-payment')}
            >
              <CIcon icon={cilCreditCard} className="me-1" />
              Declare Payment
            </CButton>
            <CButton
              color="primary"
              variant="outline"
              onClick={() => navigate('/finance/settlements')}
            >
              <CIcon icon={cilHistory} className="me-1" />
              Payment History
            </CButton>
          </div>
        }
      />

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <CRow className="mb-4 g-3">
        {kpiCards.map((card, i) => (
          <CCol sm={6} xl={3} key={card.label}>
            <div
              className={`nx-stat-card nx-fade-in nx-fade-in-d${i > 0 ? i : ''}`}
              style={{ '--stat-color': `var(${card.variant})` }}
            >
              <div className="nx-stat-icon">
                <CIcon icon={card.icon} height={22} />
              </div>
              <div className="nx-stat-body">
                <div className="nx-stat-label">{card.label}</div>
                <div className="nx-stat-value">{card.value}</div>
                {card.subtitle && (
                  <div
                    className="text-medium-emphasis"
                    style={{ fontSize: '0.75rem', marginTop: '2px' }}
                  >
                    {card.subtitle}
                  </div>
                )}
              </div>
            </div>
          </CCol>
        ))}
      </CRow>

      <CRow>
        {/* ── Unsettled Orders (Debts) ──────────────────────────── */}
        <CCol lg={8} className="mb-4">
          <CCard className="nx-fade-in nx-fade-in-d2">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                Unsettled Orders{' '}
                <CBadge color="warning" shape="rounded-pill" className="ms-1">
                  {dashboard.deliveredCount ?? 0}
                </CBadge>
              </strong>
              <CButton
                color="link"
                size="sm"
                onClick={() => navigate('/finance/declare-payment')}
              >
                Declare Payment <CIcon icon={cilArrowRight} size="sm" />
              </CButton>
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Order</CTableHeaderCell>
                    <CTableHeaderCell>Customer</CTableHeaderCell>
                    <CTableHeaderCell>Amount</CTableHeaderCell>
                    <CTableHeaderCell>Delivered</CTableHeaderCell>
                    <CTableHeaderCell>Days</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {debts.map((o) => (
                    <CTableRow
                      key={o.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/orders/${o.id}`)}
                    >
                      <CTableDataCell
                        className="text-truncate"
                        style={{
                          maxWidth: 120,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.82rem',
                        }}
                      >
                        #{o.id?.slice(0, 8)}…
                      </CTableDataCell>
                      <CTableDataCell>{o.userEmail || '—'}</CTableDataCell>
                      <CTableDataCell
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        ${(o.totalAmount || 0).toFixed(2)}
                      </CTableDataCell>
                      <CTableDataCell className="text-medium-emphasis small">
                        {o.deliveredAt
                          ? new Date(o.deliveredAt).toLocaleDateString()
                          : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <span
                          style={{
                            color: o.isOverdue ? OVERDUE_COLOR : 'inherit',
                            fontWeight: o.isOverdue ? 700 : 400,
                          }}
                        >
                          {o.daysSinceDelivery}d
                          {o.isOverdue && (
                            <CIcon
                              icon={cilWarning}
                              size="sm"
                              className="ms-1"
                              style={{ color: OVERDUE_COLOR }}
                            />
                          )}
                        </span>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  {debts.length === 0 && (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={5}
                        className="text-center text-medium-emphasis py-3"
                      >
                        No unsettled orders 🎉
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        {/* ── Quick Actions + Overdue Alerts ────────────────────── */}
        <CCol lg={4} className="mb-4">
          {/* Overdue Alert */}
          {overdueOrders.length > 0 && (
            <CAlert
              color="danger"
              className="nx-fade-in nx-fade-in-d3 mb-3"
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <CIcon icon={cilWarning} />
                <strong>
                  {overdueOrders.length} Overdue Settlement
                  {overdueOrders.length > 1 ? 's' : ''}
                </strong>
              </div>
              <small>
                These orders have been delivered for more than{' '}
                {dashboard.overdueDays ?? 7} days without settlement.
              </small>
              <div className="mt-2">
                {overdueOrders.slice(0, 3).map((o) => (
                  <div key={o.id} className="small">
                    <span
                      className="text-primary"
                      role="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/orders/${o.id}`)}
                    >
                      #{o.id?.slice(0, 8)}
                    </span>{' '}
                    — ${(o.totalAmount || 0).toFixed(2)} ({o.daysSinceDelivery}
                    d)
                  </div>
                ))}
                {overdueOrders.length > 3 && (
                  <small className="text-medium-emphasis">
                    +{overdueOrders.length - 3} more
                  </small>
                )}
              </div>
            </CAlert>
          )}

          {/* Quick Actions */}
          <h6
            className="text-uppercase text-medium-emphasis mb-3 nx-fade-in nx-fade-in-d3"
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            Finance Actions
          </h6>
          <div className="d-grid gap-2">
            {[
              {
                label: 'Declare Payment',
                icon: cilCreditCard,
                path: '/finance/declare-payment',
              },
              {
                label: 'Payment History',
                icon: cilHistory,
                path: '/finance/settlements',
              },
              {
                label: 'Export Statement',
                icon: cilCloudDownload,
                action: async () => {
                  try {
                    const now = new Date()
                    const from = new Date(
                      now.getFullYear(),
                      now.getMonth() - 1,
                      1,
                    )
                      .toISOString()
                      .split('T')[0]
                    const to = now.toISOString().split('T')[0]
                    const res = await api.get('/finance/export', {
                      params: { from, to, format: 'csv' },
                      responseType: 'blob',
                    })
                    const url = window.URL.createObjectURL(
                      new Blob([res.data]),
                    )
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `financial-statement_${from}_${to}.csv`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  } catch {
                    setError('Unable to export statement.')
                  }
                },
              },
            ].map((action, i) => (
              <div
                key={action.label}
                className={`nx-action-card nx-fade-in nx-fade-in-d${Math.min(i + 1, 4)}`}
                onClick={
                  action.path
                    ? () => navigate(action.path)
                    : action.action
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (action.path
                    ? navigate(action.path)
                    : action.action?.())
                }
              >
                <span className="nx-action-icon">
                  <CIcon icon={action.icon} height={18} />
                </span>
                <span className="nx-action-label">{action.label}</span>
                <CIcon
                  icon={cilArrowRight}
                  height={14}
                  className="ms-auto text-medium-emphasis"
                />
              </div>
            ))}
          </div>

          {/* Pending Settlements */}
          {dashboard.pendingSettlements > 0 && (
            <CAlert
              color="info"
              className="mt-3 nx-fade-in nx-fade-in-d4"
            >
              <small>
                <strong>{dashboard.pendingSettlements}</strong> settlement
                {dashboard.pendingSettlements > 1 ? 's' : ''} pending
                validation.
              </small>
            </CAlert>
          )}
        </CCol>
      </CRow>
    </div>
  )
}

export default FinanceDashboard
