import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilXCircle } from '@coreui/icons'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import { useToast } from '../../shared/components/ToastProvider'

const CategoriesCreate = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        name: formState.name,
        slug: formState.slug || undefined,
        description: formState.description || undefined,
      }
      await api.post('/categories', payload)
      addToast(`Category "${formState.name}" created.`, 'success')
      navigate('/categories', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to create category.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Create Category" subtitle="Add a new product category." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Category Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              <CIcon icon={cilPlus} className="me-1" />
              {submitting ? 'Saving…' : 'Save Category'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              <CIcon icon={cilXCircle} className="me-1" />
              Cancel
            </CButton>
          </>
        }
      >
        <div className="mb-3">
          <CFormLabel>Category Name</CFormLabel>
          <CFormInput name="name" value={formState.name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <CFormLabel>Slug</CFormLabel>
          <CFormInput
            name="slug"
            value={formState.slug}
            onChange={handleChange}
            placeholder="auto-generated from name if left empty"
          />
          <small className="text-medium-emphasis">
            Lowercase letters, numbers, and hyphens only (e.g. electronics, home-garden).
          </small>
        </div>
        <div className="mb-3">
          <CFormLabel>Description</CFormLabel>
          <CFormTextarea
            name="description"
            rows={3}
            value={formState.description}
            onChange={handleChange}
          />
        </div>
      </FormCard>
    </div>
  )
}

export default CategoriesCreate
