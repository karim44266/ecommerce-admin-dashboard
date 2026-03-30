import api from './api'

export type LoginResponse = {
  accessToken?: string
  mfaRequired?: boolean
}

export type MfaVerifyResponse = {
  accessToken: string
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const verifyMfa = async (email: string, otp: string): Promise<MfaVerifyResponse> => {
  const response = await api.post('/auth/mfa/verify', { email, otp })
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
