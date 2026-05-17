import React from 'react'
import { CFooter } from '@coreui/react'
import { company } from '../shared/company'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem' }}>{company.adminConsoleName}</span>
        <span className="ms-1" style={{ fontSize: '0.95rem' }}>&copy; {new Date().getFullYear()}</span>
      </div>
      <div className="ms-auto">
        <span className="me-1 text-medium-emphasis" style={{ fontSize: '0.95rem', letterSpacing: '0.04em', fontWeight: 600 }}>{company.operationsLabel}</span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
