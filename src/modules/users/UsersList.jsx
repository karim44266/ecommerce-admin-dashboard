import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CBadge,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CPagination,
  CPaginationItem,
  CSpinner,
} from '@coreui/react'
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
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState(null)
  const [confirmUser, setConfirmUser] = useState(null)
  const navigate = useNavigate()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (search.trim()) params.search = search.trim()
      const response = await api.get('/users', { params })
      setUsers(response.data?.data || [])
      setMeta(response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError('Unable to load users. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
  }

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
            onClick={() => setConfirmUser(row)}
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
      <form onSubmit={handleSearchSubmit}>
        <CInputGroup className="mb-3">
          <CInputGroupText>
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CInputGroup>
      </form>
      <DataTable
        title={`User Directory (${meta.total})`}
        columns={columns}
        data={users}
        loading={loading}
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-medium-emphasis">
            Page {meta.page} of {meta.totalPages} ({meta.total} users)
          </small>
          <CPagination className="mb-0">
            <CPaginationItem disabled={meta.page <= 1} onClick={() => setPage(1)}>«</CPaginationItem>
            <CPaginationItem disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>‹</CPaginationItem>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const start = Math.max(1, meta.page - 2)
              const p = start + i
              if (p > meta.totalPages) return null
              return (
                <CPaginationItem key={p} active={p === meta.page} onClick={() => setPage(p)}>
                  {p}
                </CPaginationItem>
              )
            })}
            <CPaginationItem disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>›</CPaginationItem>
            <CPaginationItem disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.totalPages)}>»</CPaginationItem>
          </CPagination>
        </div>
      )}

      {/* ── Confirm Block/Unblock Modal ─────────────────────── */}
      <CModal visible={!!confirmUser} onClose={() => setConfirmUser(null)}>
        <CModalHeader>
          <CModalTitle>
            {confirmUser?.status === 'active' ? 'Block' : 'Unblock'} User
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to{' '}
          <strong>{confirmUser?.status === 'active' ? 'block' : 'unblock'}</strong>{' '}
          <strong>{confirmUser?.email}</strong>?
          {confirmUser?.status === 'active' &&
            ' They will lose access to their account immediately.'}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setConfirmUser(null)}>
            Cancel
          </CButton>
          <CButton
            color={confirmUser?.status === 'active' ? 'danger' : 'success'}
            onClick={() => {
              handleToggleStatus(confirmUser)
              setConfirmUser(null)
            }}
          >
            {confirmUser?.status === 'active' ? 'Block' : 'Unblock'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default UsersList
