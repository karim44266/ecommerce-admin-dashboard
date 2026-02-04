import React from 'react'
import { CCard, CCardBody, CCardHeader, CForm } from '@coreui/react'

const FormCard = ({ title, onSubmit, children, actions }) => {
  return (
    <CCard className="mb-4">
      {title && <CCardHeader>{title}</CCardHeader>}
      <CCardBody>
        <CForm onSubmit={onSubmit}>
          {children}
          {actions && <div className="mt-4 d-flex gap-2">{actions}</div>}
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default FormCard
