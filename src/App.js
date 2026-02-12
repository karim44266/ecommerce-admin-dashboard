import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layouts/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./pages/Login'))
const Mfa = React.lazy(() => import('./pages/Mfa'))
const ProtectedRoute = React.lazy(() => import('./modules/auth/ProtectedRoute'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/mfa" element={<Mfa />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="*" element={<DefaultLayout />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
