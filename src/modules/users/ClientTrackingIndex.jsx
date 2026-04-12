import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert, CBadge, CButton, CFormInput, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilChart } from '@coreui/icons'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import { getApiErrorMessage, getUsers } from '../../services/usersService'

const ClientTrackingIndex = () => {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await getUsers({ page: 1, limit: 100, search: search.trim() || undefined })
      const customers = (payload?.data || []).filter((user) => user.role === 'customer')
      setRows(customers)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load clients.'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div>
      <PageHeader
        title="Client Tracking"
        subtitle="Select a client to view purchase history and order activity."
      />

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      <CInputGroup className="mb-3">
        <CInputGroupText>
          <CIcon icon={cilSearch} />
        </CInputGroupText>
        <CFormInput
          placeholder="Search clients by email or name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <CButton color="light" onClick={fetchUsers} disabled={loading}>
          {loading ? <CSpinner size="sm" /> : <CIcon icon={cilSearch} className="me-1" />}
          Search
        </CButton>
      </CInputGroup>

      <DataTable
        title={`Clients (${rows.length})`}
        loading={loading}
        data={rows}
        emptyMessage="No clients found."
        columns={[
          { key: 'email', label: 'Email' },
          { key: 'name', label: 'Name', render: (row) => row.name || '—' },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <CBadge color={row.status === 'active' ? 'success' : 'danger'}>{row.status}</CBadge>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="nx-row-actions">
                <CButton color="info" size="sm" className="nx-row-action-btn" onClick={() => navigate(`/clients/${row.id}/tracking`)}>
                  <CIcon icon={cilChart} className="me-1" />
                  Open Tracking
                </CButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default ClientTrackingIndex
