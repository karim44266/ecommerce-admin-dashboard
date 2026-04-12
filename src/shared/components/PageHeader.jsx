import React from 'react'
import { CCol, CRow } from '@coreui/react'

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <CRow className="nx-page-header align-items-center">
      <CCol>
        <h2 className="mb-1">{title}</h2>
        {subtitle && <p className="nx-page-subtitle text-medium-emphasis mb-0">{subtitle}</p>}
      </CCol>
      {actions && <CCol xs="auto">{actions}</CCol>}
    </CRow>
  )
}

export default PageHeader
