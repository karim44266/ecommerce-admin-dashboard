import React from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'

const NotFound = () => {
  return (
    <CCard>
      <CCardHeader>Page not found</CCardHeader>
      <CCardBody>
        <p className="text-medium-emphasis mb-0">The requested page does not exist.</p>
      </CCardBody>
    </CCard>
  )
}

export default NotFound
