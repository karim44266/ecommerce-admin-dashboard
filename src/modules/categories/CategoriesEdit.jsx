import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilXCircle } from '@coreui/icons'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import { useToast } from '../../shared/components/ToastProvider'

const CategoriesEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/categories/${id}`)
        const cat = res.data
        setFormState({
          name: cat?.name || '',
          slug: cat?.slug || '',
          description: cat?.description || '',
        })
      } catch {
        setError('Unable to load category details.')
      } finally {
        setLoading(false)
      }
    }
    fetchCategory()
  }, [id])

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
      await api.patch(`/categories/${id}`, payload)
      addToast(`Category "${formState.name}" updated.`, 'success')
      navigate('/categories', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to update category.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Edit Category" subtitle={`Update category ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Category Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting || loading}>
              <CIcon icon={cilPencil} className="me-1" />
              {submitting ? 'Saving…' : 'Save Changes'}
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
          <CFormInput name="slug" value={formState.slug} onChange={handleChange} />
          <small className="text-medium-emphasis">
            Auto-updated when you change the name (unless you set it manually).
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

export default CategoriesEdit
