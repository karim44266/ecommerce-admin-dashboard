import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>ProBuild Admin</span>
        <span className="ms-1">&copy; {new Date().getFullYear()}</span>
      </div>
      <div className="ms-auto">
        <span className="me-1 text-medium-emphasis" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>Operations Console</span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
