import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CDropdown,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell } from '@coreui/icons'
import api from '../../services/api'

const POLL_INTERVAL = 30_000 // 30 seconds

const NotificationBell = () => {
  const navigate = useNavigate()
  const [pendingOrders, setPendingOrders] = useState([])

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await api.get('/orders', {
        params: { status: 'PENDING', limit: 5, page: 1, sortBy: 'createdAt', sortOrder: 'desc' },
      })
      setPendingOrders(data?.data || [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchPending()
    const timer = setInterval(fetchPending, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchPending])

  const count = pendingOrders.length

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle caret={false} className="position-relative">
        <CIcon icon={cilBell} size="lg" />
        {count > 0 && (
          <CBadge
            color="danger"
            shape="rounded-pill"
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.65rem' }}
          >
            {count}
          </CBadge>
        )}
      </CDropdownToggle>
      <CDropdownMenu style={{ minWidth: 280 }}>
        <CDropdownHeader className="fw-semibold">
          {count > 0 ? `${count} Pending Order${count > 1 ? 's' : ''}` : 'No pending orders'}
        </CDropdownHeader>
        {pendingOrders.map((o) => (
          <CDropdownItem
            key={o.id}
            as="button"
            onClick={() => navigate(`/orders/${o.id}`)}
          >
            <div className="d-flex justify-content-between">
              <span className="text-truncate" style={{ maxWidth: 140 }}>
                #{o.id?.slice(0, 8)}
              </span>
              <span className="fw-semibold">${(o.totalAmount || 0).toFixed(2)}</span>
            </div>
            <small className="text-body-secondary">
              {o.customerEmail || 'Unknown'} — {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}
            </small>
          </CDropdownItem>
        ))}
        {count > 0 && (
          <>
            <CDropdownItem
              as="button"
              className="text-center fw-semibold text-primary"
              onClick={() => navigate('/orders')}
            >
              View all orders
            </CDropdownItem>
          </>
        )}
      </CDropdownMenu>
    </CDropdown>
  )
}

export default NotificationBell
