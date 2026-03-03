import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert, CButton, CBadge, CFormInput, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const roleBadgeColor = (role) => {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'staff':
      return 'warning'
    case 'customer':
    default:
      return 'info'
  }
}

const statusBadgeColor = (status) => (status === 'active' ? 'success' : 'danger')

const UsersList = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const navigate = useNavigate()

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/users')
      setUsers(response.data || [])
    } catch (err) {
      setError('Unable to load users. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active'
    setTogglingId(user.id)
    setError('')
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus })
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      )
    } catch (err) {
      setError(`Failed to ${newStatus === 'blocked' ? 'block' : 'unblock'} user.`)
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = users.filter((user) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.role && user.role.toLowerCase().includes(q))
    )
  })

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name', render: (row) => row.name || '\u2014' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <CBadge color={roleBadgeColor(row.role)}>{row.role}</CBadge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CBadge color={statusBadgeColor(row.status)}>{row.status}</CBadge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <CButton color="info" size="sm" onClick={() => navigate(`/users/${row.id}/roles`)}>
            Roles
          </CButton>
          <CButton
            color={row.status === 'active' ? 'warning' : 'success'}
            size="sm"
            disabled={togglingId === row.id}
            onClick={() => handleToggleStatus(row)}
          >
            {togglingId === row.id ? (
              <CSpinner size="sm" />
            ) : row.status === 'active' ? (
              'Block'
            ) : (
              'Unblock'
            )}
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage users, roles, and access." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <CInputGroup className="mb-3">
        <CInputGroupText>
          <CIcon icon={cilSearch} />
        </CInputGroupText>
        <CFormInput
          placeholder="Search by name, email, or role\u2026"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CInputGroup>
      <DataTable
        title={`User Directory (${filtered.length})`}
        columns={columns}
        data={filtered}
        loading={loading}
      />
    </div>
  )
}

export default UsersList
