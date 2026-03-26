import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CBadge,
  CFormLabel,
  CFormInput,
  CFormSelect,
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
import { useToast } from '../../shared/components/ToastProvider'
import {
  createUser,
  getApiErrorMessage,
  getUsers,
  updateUserStatus,
} from '../../services/usersService'
import { isAdmin } from '../auth/authStorage'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const roleBadgeColor = (role) => {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'staff':
      return 'warning'
    case 'reseller':
      return 'primary'
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    role: 'reseller',
  })
  const navigate = useNavigate()
  const { addToast } = useToast()

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      password: '',
      role: 'reseller',
    })
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (search.trim()) params.search = search.trim()
      const payload = await getUsers(params)
      setUsers(payload?.data || [])
      setMeta(payload?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load users. Make sure the backend is running.'))
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

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active'
    setTogglingId(user.id)
    setError('')
    try {
      await updateUserStatus(user.id, newStatus)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      )
      addToast(
        `User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully.`,
        'success',
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          `Failed to ${newStatus === 'blocked' ? 'block' : 'unblock'} user.`,
        ),
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setCreatingUser(true)
    setError('')

    try {
      const payload = {
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      }
      await createUser(payload)
      addToast(`User ${payload.email} created successfully.`, 'success')
      setShowCreateModal(false)
      resetCreateForm()
      if (page === 1) {
        await fetchUsers()
      } else {
        setPage(1)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create user.'))
    } finally {
      setCreatingUser(false)
    }
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
      <PageHeader
        title="Users"
        subtitle="Manage users, roles, and access."
        actions={
          <CButton color="primary" onClick={() => setShowCreateModal(true)}>
            Add User
          </CButton>
        }
      />
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

      <CModal
        visible={showCreateModal}
        onClose={() => {
          if (creatingUser) return
          setShowCreateModal(false)
          resetCreateForm()
        }}
      >
        <form onSubmit={handleCreateUser}>
          <CModalHeader>
            <CModalTitle>Add User</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel htmlFor="create-user-email">Email</CFormLabel>
              <CFormInput
                id="create-user-email"
                type="email"
                autoComplete="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="create-user-password">Password</CFormLabel>
              <CFormInput
                id="create-user-password"
                type="password"
                autoComplete="new-password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                }
                minLength={6}
                required
              />
            </div>
            <div className="mb-0">
              <CFormLabel htmlFor="create-user-role">Role</CFormLabel>
              <CFormSelect
                id="create-user-role"
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, role: event.target.value }))
                }
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
                <option value="reseller">Reseller</option>
              </CFormSelect>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              variant="ghost"
              type="button"
              disabled={creatingUser}
              onClick={() => {
                setShowCreateModal(false)
                resetCreateForm()
              }}
            >
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create User'}
            </CButton>
          </CModalFooter>
        </form>
      </CModal>
    </div>
  )
}

export default UsersList
