/**
 * Unified order status constants used across all order-related pages.
 * Single source of truth – update here to propagate everywhere.
 */

export const STATUS_COLORS = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  PROCESSING: 'primary',
  DELIVERED: 'success',
  COMPLETED: 'primary',
  CANCELLED: 'danger',
  REFUNDED: 'secondary',
  FAILED: 'danger',
}

export const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PROCESSING: 'Processing',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
}

/** Mirrors STATUS_TRANSITIONS from the backend DTO */
export const STATUS_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: ['PROCESSING'],
}

export const ALL_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PROCESSING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'FAILED',
]
