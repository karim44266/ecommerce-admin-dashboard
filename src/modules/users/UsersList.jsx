import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CButton, CBadge } from '@coreui/react'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const UsersList = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError('')
      try {
        // TODO: Replace with real users list endpoint.
        const response = await api.get('/users')
        setUsers(response.data || [])
      } catch (err) {
        setError('Unable to load users. Connect the backend endpoint to proceed.')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <CBadge color="secondary">{row.role}</CBadge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <CButton color="info" size="sm" component={Link} to={`/users/${row.id}/roles`}>
            Roles
          </CButton>
          <CButton color="warning" size="sm" component={Link} to={`/users/${row.id}/status`}>
            Block/Unblock
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage staff access and permissions." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <DataTable title="User Directory" columns={columns} data={users} loading={loading} />
    </div>
  )
}

export default UsersList
