import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChart, cilSearch, cilPencil, cilTrash, cilPlus, cilXCircle } from '@coreui/icons'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import TruncatedPagination from '../../shared/components/TruncatedPagination'
import { useToast } from '../../shared/components/ToastProvider'

const CategoriesList = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { addToast } = useToast()
  const debounceRef = useRef(null)

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/categories', { params })
      setCategories(res.data?.data || [])
      setMeta(res.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 })
    } catch {
      setError('Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories({ page, limit: 20, search: search || undefined })
  }, [fetchCategories, page, search])

  const handleSearchChange = (e) => {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, 300)
  }

  const handleDelete = async (id, name) => {
    setDeleting(true)
    try {
      await api.delete(`/categories/${id}`)
      addToast(`Category "${name}" deleted.`, 'success')
      setDeleteModal(false)
      setDeleteTarget(null)
      fetchCategories({ page, limit: 20, search: search || undefined })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to delete category.'
      addToast(Array.isArray(msg) ? msg.join(', ') : msg, 'danger')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (row) => {
    setDeleteTarget(row)
    setDeleteModal(true)
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug', render: (row) => <code>{row.slug}</code> },
    {
      key: 'description',
      label: 'Description',
      render: (row) =>
        row.description ? (
          <span title={row.description}>
            {row.description.length > 60 ? row.description.slice(0, 60) + '…' : row.description}
          </span>
        ) : (
          <span className="text-medium-emphasis">—</span>
        ),
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (row) => <CBadge color="info">{row.productCount}</CBadge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2 nx-row-actions">
          <CButton
            color="info"
            size="sm"
            variant="outline"
            className="nx-row-action-btn"
            onClick={() => navigate(`/categories/${row.id}/details`)}
          >
            <CIcon icon={cilChart} className="me-1" />
            Details
          </CButton>
          <CButton
            color="primary"
            size="sm"
            className="nx-row-action-btn"
            onClick={() => navigate(`/categories/${row.id}`)}
          >
            <CIcon icon={cilPencil} className="me-1" />
            Edit
          </CButton>
          <CButton
            color="danger"
            size="sm"
            className="nx-row-action-btn"
            disabled={row.productCount > 0}
            title={row.productCount > 0 ? 'Reassign products first' : 'Delete category'}
            onClick={() => openDeleteModal(row)}
          >
            <CIcon icon={cilTrash} className="me-1" />
            Delete
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize products into categories."
        actions={
          <div className="nx-utility-actions">
            <CButton color="primary" className="nx-utility-btn" onClick={() => navigate('/categories/new')}>
              <CIcon icon={cilPlus} className="me-1" />
            Add Category
            </CButton>
          </div>
        }
      />
      {error && <CAlert color="danger">{error}</CAlert>}
      <CInputGroup className="mb-3">
        <CInputGroupText>
          <CIcon icon={cilSearch} />
        </CInputGroupText>
        <CFormInput
          placeholder="Search categories…"
          defaultValue={search}
          onChange={handleSearchChange}
        />
      </CInputGroup>
      <DataTable
        title={`Categories (${meta.total})`}
        columns={columns}
        data={categories}
        loading={loading}
        emptyMessage="No categories found."
      />
      <TruncatedPagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />

      {/* Delete confirmation modal */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Delete Category</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteTarget && (
            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModal(false)} disabled={deleting}>
            <CIcon icon={cilXCircle} className="me-1" />
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={() => handleDelete(deleteTarget?.id, deleteTarget?.name)}
            disabled={deleting}
          >
            <CIcon icon={cilTrash} className="me-1" />
            {deleting ? 'Deleting…' : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default CategoriesList
