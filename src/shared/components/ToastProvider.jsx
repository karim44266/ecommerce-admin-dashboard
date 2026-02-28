import React, { createContext, useCallback, useContext, useState } from 'react'
import { CToast, CToastBody, CToastClose, CToaster } from '@coreui/react'

const ToastContext = createContext({
  addToast: () => {},
})

export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, color = 'success', delay = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, color, delay }])
    // Auto-remove after delay + animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, delay + 500)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <CToaster className="p-3" placement="top-end">
        {toasts.map((t) => (
          <CToast
            key={t.id}
            autohide
            visible
            delay={t.delay}
            color={t.color}
            className="text-white align-items-center"
          >
            <div className="d-flex">
              <CToastBody>{t.message}</CToastBody>
              <CToastClose className="me-2 m-auto" white />
            </div>
          </CToast>
        ))}
      </CToaster>
    </ToastContext.Provider>
  )
}
