import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import PageHeader from '../../shared/components/PageHeader'
import DataTable from '../../shared/components/DataTable'
import {
  getApiErrorMessage,
  getUsers,
} from '../../services/usersService'
import { isAdmin } from '../auth/authStorage'

const statusBadgeColor = (status) => (status === 'active' ? 'success' : 'danger')

const ClientTrackingIndex = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await getUsers({
        page,
        limit: 20,
        ...(search.trim() && { search: search.trim() }),
      })
      setUsers(payload?.data || [])
      setMeta(payload?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load clients.'))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard', { replace: true })
      return
    }
    fetchUsers()
  }, [fetchUsers, navigate])

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name', render: (row) => row.name || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CBadge color={statusBadgeColor(row.status)}>{row.status}</CBadge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <CButton
          color="primary"
          size="sm"
          onClick={() => navigate(`/clients/${row.id}/tracking`)}
        >
          Open Tracking
        </CButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Client Tracking"
        subtitle="Select a client to view purchase history and activity."
      />

      {error && <CAlert color="danger">{error}</CAlert>}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          fetchUsers()
        }}
      >
        <CInputGroup className="mb-3">
          <CInputGroupText>
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput
            placeholder="Search by client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CButton type="submit" color="primary">Search</CButton>
        </CInputGroup>
      </form>

      {loading && users.length === 0 ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : (
        <DataTable
          title={`Clients (${meta.total})`}
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No clients found."
        />
      )}

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-medium-emphasis">
            Page {meta.page} of {meta.totalPages}
          </small>
          <div className="d-flex gap-2">
            <CButton
              color="secondary"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </CButton>
            <CButton
              color="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next
            </CButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientTrackingIndex
