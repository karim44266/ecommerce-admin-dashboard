import api from './api'

export type LoginResponse = {
  accessToken?: string
  refreshToken?: string
  mfaRequired?: boolean
  blocked?: boolean
  blockedMessage?: string
}

export type MfaVerifyResponse = {
  accessToken: string
  refreshToken: string
}

export type RefreshResponse = {
  accessToken: string
  refreshToken: string
}

export type InactivityConfigResponse = {
  timeoutMinutes: number
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const verifyMfa = async (email: string, otp: string): Promise<MfaVerifyResponse> => {
  const response = await api.post('/auth/mfa/verify', { email, otp })
  return response.data
}

export const refreshAccessToken = async (refreshToken: string): Promise<RefreshResponse> => {
  const response = await api.post('/auth/refresh', { refreshToken })
  return response.data
}

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout')
}

export const forgotPassword = async (
  identifier: string,
  message?: string,
): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { identifier, message })
  return response.data
}

export const submitBlockedAppeal = async (
  name: string,
  accountNumber: string,
  explanation: string,
): Promise<{ message: string }> => {
  const response = await api.post('/auth/blocked-appeal', { name, accountNumber, explanation })
  return response.data
}

export const getInactivityConfig = async (): Promise<InactivityConfigResponse> => {
  const response = await api.get('/auth/inactivity-config')
  return response.data
}

export const getApiErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong. Please try again.'
  }

  const maybeError = error as {
    message?: string
    response?: { data?: { message?: string | string[] } }
  }

  const responseMessage = maybeError.response?.data?.message
  if (Array.isArray(responseMessage)) {
    return responseMessage.join(', ')
  }

  if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
    return responseMessage
  }

  if (typeof maybeError.message === 'string' && maybeError.message.trim().length > 0) {
    return maybeError.message
  }

  return 'Something went wrong. Please try again.'
}
