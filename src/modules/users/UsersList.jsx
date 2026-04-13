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
import {
  cilSearch,
  cilPencil,
  cilChart,
  cilXCircle,
  cilCheckCircle,
  cilPlus,
} from '@coreui/icons'
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
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState(null)
  const [confirmUser, setConfirmUser] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    role: 'CUSTOMER',
  })
  const navigate = useNavigate()
  const { addToast } = useToast()

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      password: '',
      role: 'CUSTOMER',
    })
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (search.trim()) params.search = search.trim()
      if (roleFilter !== 'all') params.role = roleFilter
      const payload = await getUsers(params)
      setUsers(payload?.data || [])
      setMeta(payload?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load users. Make sure the backend is running.'))
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

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
        role: createForm.role.toUpperCase(),
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
      render: (row) => {
        if (row.role === 'staff') {
          const isAvailable = row.availabilityStatus === 'AVAILABLE'
          return (
            <CBadge color={isAvailable ? 'success' : 'secondary'}>
              {isAvailable ? 'Available' : 'Not Available'}
            </CBadge>
          )
        }
        return <CBadge color={statusBadgeColor(row.status)}>{row.status}</CBadge>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2 nx-row-actions">
          <CButton color="info" size="sm" className="nx-row-action-btn" onClick={() => navigate(`/users/${row.id}/roles`)}>
            <CIcon icon={cilPencil} className="me-1" />
            Roles
          </CButton>
          {row.role === 'customer' && (
            <CButton color="primary" size="sm" className="nx-row-action-btn" onClick={() => navigate(`/clients/${row.id}/tracking`)}>
              <CIcon icon={cilChart} className="me-1" />
              Tracking
            </CButton>
          )}
          <CButton
            color={row.status === 'active' ? 'warning' : 'success'}
            size="sm"
            className="nx-row-action-btn"
            disabled={togglingId === row.id}
            onClick={() => setConfirmUser(row)}
          >
            {togglingId === row.id ? (
              <CSpinner size="sm" />
            ) : row.status === 'active' ? (
              <>
                <CIcon icon={cilXCircle} className="me-1" />
                Block
              </>
            ) : (
              <>
                <CIcon icon={cilCheckCircle} className="me-1" />
                Unblock
              </>
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
          <div className="nx-utility-actions">
            <CButton color="primary" className="nx-utility-btn" onClick={() => setShowCreateModal(true)}>
              <CIcon icon={cilPlus} className="me-1" />
              Add User
            </CButton>
          </div>
        }
      />
      {error && <CAlert color="danger">{error}</CAlert>}
      <form onSubmit={handleSearchSubmit}>
        <div className="d-flex flex-column flex-md-row gap-2 mb-3">
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CInputGroup>
          <CFormSelect
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            style={{ maxWidth: '220px' }}
          >
            <option value="all">All Roles</option>
            <option value="customer">Clients</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff</option>
          </CFormSelect>
        </div>
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
            <CIcon icon={cilXCircle} className="me-1" />
            Cancel
          </CButton>
          <CButton
            color={confirmUser?.status === 'active' ? 'danger' : 'success'}
            onClick={() => {
              handleToggleStatus(confirmUser)
              setConfirmUser(null)
            }}
          >
            <CIcon icon={confirmUser?.status === 'active' ? cilXCircle : cilCheckCircle} className="me-1" />
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
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="CUSTOMER">Customer</option>
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
              <CIcon icon={cilXCircle} className="me-1" />
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={creatingUser}>
              <CIcon icon={cilPlus} className="me-1" />
              {creatingUser ? 'Creating...' : 'Create User'}
            </CButton>
          </CModalFooter>
        </form>
      </CModal>
    </div>
  )
}

export default UsersList
