import React from 'react'
import { CCol, CRow } from '@coreui/react'

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <CRow className="align-items-center mb-4">
      <CCol>
        <h2 className="mb-1">{title}</h2>
        {subtitle && <p className="text-medium-emphasis mb-0">{subtitle}</p>}
      </CCol>
      {actions && <CCol xs="auto">{actions}</CCol>}
    </CRow>
  )
}

export default PageHeader
