import api from './api'

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong.') => {
  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string | string[]
      }
    }
    message?: string
  }

  const message = maybeAxiosError?.response?.data?.message
  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (typeof maybeAxiosError?.message === 'string' && maybeAxiosError.message.trim()) {
    return maybeAxiosError.message
  }

  return fallback
}

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
}

export interface GetClientPurchasesParams {
  status?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface UserListResponse {
  data: Array<{
    id: string
    email: string
    name?: string
    role: string
    status: string
    roles?: string[]
    createdAt?: string
    updatedAt?: string
  }>
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ClientPurchasesResponse {
  client: {
    id: string
    email: string
    name?: string | null
    status: string
  }
  summary: {
    totalOrders: number
    totalSpent: number
    averageOrderValue: number
    lastPurchaseAt: string | null
  }
  purchases: Array<{
    id: string
    status: string
    totalAmount: number
    itemCount: number
    createdAt: string
    shippingAddress?: Record<string, string | undefined> | null
  }>
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const getUsers = async (params: GetUsersParams = {}) => {
  const response = await api.get<UserListResponse>('/users', { params })
  return response.data
}

export const getUserById = async (id: string) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

export const createUser = async (payload: { email: string; password: string; role: string }) => {
  const response = await api.post('/users', payload)
  return response.data
}

export const updateUserRole = async (id: string, role: string) => {
  const response = await api.patch(`/users/${id}/role`, { role })
  return response.data
}

export const updateUserStatus = async (id: string, status: string) => {
  const response = await api.patch(`/users/${id}/status`, { status })
  return response.data
}

export const getClientPurchases = async (
  id: string,
  params: GetClientPurchasesParams = {},
) => {
  const response = await api.get<ClientPurchasesResponse>(`/users/${id}/purchases`, {
    params,
  })
  return response.data
}
