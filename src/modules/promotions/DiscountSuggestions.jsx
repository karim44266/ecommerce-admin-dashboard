import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilChart, cilCheckCircle, cilPencil, cilReload, cilSearch, cilXCircle } from '@coreui/icons'
import PageHeader from '../../shared/components/PageHeader'
import DataTable from '../../shared/components/DataTable'
import api from '../../services/api'
import { getApiErrorMessage, getUsers } from '../../services/usersService'
import { formatCurrency } from '../../shared/utils/formatters'

const DAY_OPTIONS = [1, 7, 14, 30]
const SPARKLINE_STROKE = {
  primary: '#14b8a6',
  success: '#10b981',
  info: '#0ea5e9',
  warning: '#f59e0b',
  neutral: '#94a3b8',
}

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`
const formatCount = (value) => Number(value || 0).toLocaleString()
const formatConfidence = (value) => `${Math.round(Number(value || 0) * 100)}%`
const formatSignedPercent = (value) => {
  const numeric = Number(value || 0)
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toFixed(1)}%`
}

const calculateTrendChange = (currentValue, previousValue) => {
  const current = Number(currentValue || 0)
  const previous = Number(previousValue || 0)

  if (previous === 0) {
    if (current === 0) {
      return 0
    }
    return 100
  }

  return ((current - previous) / Math.abs(previous)) * 100
}

const getTrendDirection = (delta) => {
  if (delta > 0.01) return 'up'
  if (delta < -0.01) return 'down'
  return 'flat'
}

const KpiSparkline = ({ points, tone }) => {
  const sanitized = Array.isArray(points)
    ? points
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry))
    : []

  if (sanitized.length === 0) {
    return null
  }

  const normalized = sanitized.length === 1 ? [sanitized[0], sanitized[0]] : sanitized
  const min = Math.min(...normalized)
  const max = Math.max(...normalized)
  const range = max - min || 1

  const coords = normalized.map((point, index) => {
    const x = normalized.length === 1 ? 0 : (index / (normalized.length - 1)) * 100
    const y = 24 - ((point - min) / range) * 18
    return `${x},${Number.isFinite(y) ? y : 24}`
  })

  const stroke = SPARKLINE_STROKE[tone] || SPARKLINE_STROKE.neutral

  return (
    <svg className="nx-kpi-sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const sourceBadgeColor = (source) => {
  if (source === 'personalized') return 'success'
  if (source === 'fallback') return 'warning'
  return 'info'
}

const scopeBadgeColor = (scope) => {
  if (scope === 'ALL_USERS') return 'primary'
  if (scope === 'CATEGORY') return 'warning'
  return 'success'
}

const scopeLabel = (scope) => {
  if (scope === 'ALL_USERS') return 'All Products'
  if (scope === 'CATEGORY') return 'Category'
  if (scope === 'PRODUCT_SET') return 'Product Set'
  return scope || 'Unknown'
}

/** @typedef {'draft' | 'active'} DiscountStatus */
const DISCOUNT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
}

const normalizeDiscountStatus = (status) => {
  const normalized = String(status || '').toUpperCase()

  if (!normalized) {
    return null
  }

  if (normalized === 'ACTIVE') {
    return DISCOUNT_STATUS.ACTIVE
  }

  if (normalized === 'EXPIRED') {
    return null
  }

  return DISCOUNT_STATUS.DRAFT
}

const statusBadgeColor = (status) => {
  if (status === DISCOUNT_STATUS.ACTIVE) return 'success'
  if (status === DISCOUNT_STATUS.DRAFT) return 'secondary'
  return 'dark'
}

const statusLabel = (status) => {
  if (status === DISCOUNT_STATUS.ACTIVE) return 'Active'
  if (status === DISCOUNT_STATUS.DRAFT) return 'Draft'
  return status || 'Unknown'
}

const normalizeOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const normalizeOptionalInteger = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return Math.max(1, Math.round(parsed))
}

const toDateTimeLocalInput = (value) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const offsetMinutes = parsed.getTimezoneOffset()
  const local = new Date(parsed.getTime() - offsetMinutes * 60_000)
  return local.toISOString().slice(0, 16)
}

const normalizeDateTimeToIso = (value) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString()
}

const normalizeOfferCampaignPayload = (draft) => {
  const discountValue = Number(draft?.discountValue)
  const status = String(draft?.status || '').toLowerCase() === DISCOUNT_STATUS.ACTIVE
    ? 'ACTIVE'
    : 'DRAFT'

  return {
    name: String(draft?.name || 'AI Discount Campaign').trim(),
    scope: draft?.scope || 'ALL_USERS',
    discountType: draft?.discountType || 'PERCENT',
    discountValue: Number.isFinite(discountValue) ? discountValue : 10,
    minOrderAmount: normalizeOptionalNumber(draft?.minOrderAmount),
    maxRedemptions: normalizeOptionalInteger(draft?.maxRedemptions),
    startsAt: draft?.startsAt,
    endsAt: draft?.endsAt,
    status,
    stackable: Boolean(draft?.stackable),
    ...(draft?.scope === 'PRODUCT_SET'
      ? { productIds: Array.isArray(draft?.productIds) ? draft.productIds : [] }
      : {}),
    ...(draft?.scope === 'CATEGORY'
      ? { categoryIds: Array.isArray(draft?.categoryIds) ? draft.categoryIds : [] }
      : {}),
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

const normalizeIdList = (value) => (Array.isArray(value) ? value.map((entry) => String(entry)) : [])

const campaignDiscountLabel = (campaign) => {
  const type = String(campaign?.discountType || 'PERCENT').toUpperCase()
  const discountValue = Number(campaign?.discountValue ?? 0)

  if (type === 'FIXED') {
    return formatCurrency(discountValue)
  }

  return `${Number.isFinite(discountValue) ? discountValue.toFixed(2) : '0.00'}%`
}

const isCampaignVisibleForUser = (campaign, userId) => {
  if (!campaign || !userId) {
    return false
  }

  const targetUserIds = normalizeIdList(campaign.targetUserIds)
  const matchesUser = targetUserIds.length === 0 || targetUserIds.includes(String(userId))

  if (!matchesUser) {
    return false
  }

  return normalizeDiscountStatus(campaign.status) !== null
}

const DiscountSuggestions = () => {
  const navigate = useNavigate()

  const [clients, setClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [loadingActivatedOffers, setLoadingActivatedOffers] = useState(false)

  const [clientError, setClientError] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [metricsError, setMetricsError] = useState('')
  const [offersError, setOffersError] = useState('')
  const [offersSuccess, setOffersSuccess] = useState('')
  const [activatedOffersError, setActivatedOffersError] = useState('')

  const [days, setDays] = useState('7')
  const [preview, setPreview] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [offerSuggestions, setOfferSuggestions] = useState([])
  const [offerDrafts, setOfferDrafts] = useState({})
  const [offerSource, setOfferSource] = useState('')
  const [offerProfileSnapshot, setOfferProfileSnapshot] = useState(null)
  const [acceptingSuggestionId, setAcceptingSuggestionId] = useState('')
  const [activatedOffers, setActivatedOffers] = useState([])
  const [deletingOfferId, setDeletingOfferId] = useState('')
  const [activatingOfferId, setActivatingOfferId] = useState('')
  const [draftingOfferId, setDraftingOfferId] = useState('')
  const [editingActivatedOfferId, setEditingActivatedOfferId] = useState('')
  const [editingActivatedOfferDraft, setEditingActivatedOfferDraft] = useState(null)
  const [savingActivatedOfferId, setSavingActivatedOfferId] = useState('')
  const [offerSortBy, setOfferSortBy] = useState('conversions')

  const buildOfferDraftMap = (offers) => {
    const nextDrafts = {}

    offers.forEach((offer) => {
      const draft = offer?.campaignDraft || {}
      nextDrafts[offer.suggestionId] = {
        ...draft,
        minOrderAmount: draft.minOrderAmount ?? '',
        maxRedemptions: draft.maxRedemptions ?? '',
      }
    })

    return nextDrafts
  }

  const fetchClients = useCallback(async (searchTerm = '') => {
    setLoadingClients(true)
    setClientError('')

    try {
      const payload = await getUsers({
        page: 1,
        limit: 100,
        role: 'customer',
        search: searchTerm.trim() || undefined,
      })

      const customerRows = (payload?.data || []).filter(
        (user) => String(user.role || '').toLowerCase() === 'customer',
      )

      setClients(customerRows)
      setSelectedUserId((current) => {
        if (current && customerRows.some((user) => user.id === current)) {
          return current
        }
        return customerRows[0]?.id || ''
      })
    } catch (error) {
      setClientError(getApiErrorMessage(error, 'Unable to load customers.'))
      setClients([])
      setSelectedUserId('')
    } finally {
      setLoadingClients(false)
    }
  }, [])

  const fetchPreview = useCallback(async (userId) => {
    if (!userId) {
      setPreview(null)
      return
    }

    setLoadingPreview(true)
    setPreviewError('')

    try {
      const response = await api.get('/admin/promotions/recommendations/preview', {
        params: { userId },
      })
      setPreview(response.data || null)
    } catch (error) {
      setPreview(null)
      setPreviewError(getApiErrorMessage(error, 'Unable to load promotion suggestions.'))
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  const fetchMetrics = useCallback(async (nextDays = 7) => {
    setLoadingMetrics(true)
    setMetricsError('')

    try {
      const response = await api.get('/admin/promotions/metrics', {
        params: { days: nextDays },
      })
      setMetrics(response.data || null)
    } catch (error) {
      setMetrics(null)
      setMetricsError(getApiErrorMessage(error, 'Unable to load promotion metrics.'))
    } finally {
      setLoadingMetrics(false)
    }
  }, [])

  const fetchDiscountOffers = useCallback(async (userId) => {
    if (!userId) {
      setOfferSuggestions([])
      setOfferDrafts({})
      setOfferSource('')
      setOfferProfileSnapshot(null)
      return
    }

    setLoadingOffers(true)
    setOffersError('')
    setOffersSuccess('')

    try {
      const response = await api.get('/admin/promotions/discount-offers/suggestions', {
        params: {
          userId,
          applyToAllProducts: false,
        },
      })

      const payload = response.data || {}
      const offers = Array.isArray(payload.offers) ? payload.offers : []

      setOfferSuggestions(offers)
      setOfferDrafts(buildOfferDraftMap(offers))
      setOfferSource(payload.source || '')
      setOfferProfileSnapshot(payload.profileSnapshot || null)
    } catch (error) {
      setOfferSuggestions([])
      setOfferDrafts({})
      setOfferSource('')
      setOfferProfileSnapshot(null)
      setOffersError(getApiErrorMessage(error, 'Unable to generate discount offers.'))
    } finally {
      setLoadingOffers(false)
    }
  }, [])

  const fetchActivatedOffers = useCallback(async (userId) => {
    if (!userId) {
      setActivatedOffers([])
      setActivatedOffersError('')
      return
    }

    setLoadingActivatedOffers(true)
    setActivatedOffersError('')

    try {
      const response = await api.get('/admin/discount-campaigns')
      const campaigns = Array.isArray(response.data) ? response.data : []

      const activeForSelectedUser = campaigns
        .filter((campaign) => isCampaignVisibleForUser(campaign, userId))
        .sort((left, right) => {
          const leftDate = new Date(left.updatedAt || left.createdAt || 0).getTime()
          const rightDate = new Date(right.updatedAt || right.createdAt || 0).getTime()
          return rightDate - leftDate
        })

      setActivatedOffers(activeForSelectedUser)
    } catch (error) {
      setActivatedOffers([])
      setActivatedOffersError(
        getApiErrorMessage(error, 'Unable to load customer offers.'),
      )
    } finally {
      setLoadingActivatedOffers(false)
    }
  }, [])

  const updateOfferDraft = (suggestionId, patch) => {
    setOfferDrafts((current) => ({
      ...current,
      [suggestionId]: {
        ...(current[suggestionId] || {}),
        ...patch,
      },
    }))
  }

  const acceptOffer = async (offer, activateNow = true) => {
    if (!selectedUserId) {
      return
    }

    const draft = offerDrafts[offer.suggestionId] || offer.campaignDraft || {}
    const campaignPayload = normalizeOfferCampaignPayload(draft)

    setAcceptingSuggestionId(offer.suggestionId)
    setOffersError('')
    setOffersSuccess('')

    try {
      const response = await api.post('/admin/promotions/discount-offers/accept', {
        userId: selectedUserId,
        suggestionId: offer.suggestionId,
        activate: activateNow,
        campaign: campaignPayload,
      })

      const createdName = response?.data?.campaign?.name || campaignPayload.name
      setOffersSuccess(
        activateNow
          ? `Campaign "${createdName}" was accepted and activated.`
          : `Campaign "${createdName}" was saved as draft.`,
      )

      await fetchDiscountOffers(selectedUserId)
      await fetchActivatedOffers(selectedUserId)
    } catch (error) {
      setOffersError(getApiErrorMessage(error, 'Unable to accept this suggestion.'))
    } finally {
      setAcceptingSuggestionId('')
    }
  }

  useEffect(() => {
    void fetchClients()
    void fetchMetrics(7)
  }, [fetchClients, fetchMetrics])

  useEffect(() => {
    if (!selectedUserId) {
      setPreview(null)
      setOfferSuggestions([])
      setOfferDrafts({})
      setOfferSource('')
      setOfferProfileSnapshot(null)
      setActivatedOffers([])
      setActivatedOffersError('')
      setEditingActivatedOfferId('')
      setEditingActivatedOfferDraft(null)
      return
    }
    void fetchPreview(selectedUserId)
    void fetchActivatedOffers(selectedUserId)
  }, [fetchActivatedOffers, fetchPreview, selectedUserId])

  useEffect(() => {
    if (!editingActivatedOfferId) {
      return
    }

    const isOfferStillVisible = activatedOffers.some(
      (campaign) => campaign.id === editingActivatedOfferId,
    )

    if (!isOfferStillVisible) {
      setEditingActivatedOfferId('')
      setEditingActivatedOfferDraft(null)
    }
  }, [activatedOffers, editingActivatedOfferId])

  useEffect(() => {
    if (!selectedUserId) {
      return
    }

    void fetchDiscountOffers(selectedUserId)
  }, [fetchDiscountOffers, selectedUserId])

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedUserId) || null,
    [clients, selectedUserId],
  )

  const recommendationRows = useMemo(() => {
    return (preview?.recommendations || []).map((item, index) => ({
      id: `${item.productId}-${index}`,
      position: index + 1,
      productId: item.productId,
      productName: item.productName,
      categoryId: item.categoryId,
      price: item.price,
      stockLevel: item.stockLevel,
      score: item.score,
      promotionReason: item.promotionReason,
      isAdminForced: item.isAdminForced,
    }))
  }, [preview])

  const bySourceRows = useMemo(() => {
    return (metrics?.bySource || []).map((entry) => ({
      id: entry.source,
      source: entry.source,
      impressions: Number(entry.impressions ?? 0),
      clicks: Number(entry.clicks ?? 0),
      conversions: Number(entry.conversions ?? 0),
      CTR: Number(entry.CTR ?? 0),
      conversionRate: Number(entry.conversionRate ?? 0),
    }))
  }, [metrics])

  const topProductsRows = useMemo(() => {
    return (metrics?.topConvertingProducts || []).map((entry) => ({
      id: entry.productId,
      productId: entry.productId,
      productName: entry.productName || null,
      conversions: Number(entry.conversions ?? 0),
      revenueAttributed: Number(entry.revenueAttributed ?? 0),
    }))
  }, [metrics])

  const timelineRows = useMemo(() => {
    return (metrics?.timeline || []).map((entry) => ({
      bucket: String(entry.bucket || ''),
      label: String(entry.label || entry.bucket || ''),
      impressions: Number(entry.impressions ?? 0),
      clicks: Number(entry.clicks ?? 0),
      conversions: Number(entry.conversions ?? 0),
      adminForcedImpressions: Number(entry.adminForcedImpressions ?? 0),
      adminForcedClicks: Number(entry.adminForcedClicks ?? 0),
      adminForcedConversions: Number(entry.adminForcedConversions ?? 0),
      CTR: Number(entry.CTR ?? 0),
      conversionRate: Number(entry.conversionRate ?? 0),
      revenueAttributed: Number(entry.revenueAttributed ?? 0),
      revenuePerClick: Number(entry.revenuePerClick ?? 0),
    }))
  }, [metrics])

  const topOfferPerformanceRows = useMemo(() => {
    if (Array.isArray(metrics?.topOfferPerformance) && metrics.topOfferPerformance.length > 0) {
      return metrics.topOfferPerformance.map((entry) => ({
        productId: String(entry.productId),
        productName: entry.productName || null,
        conversions: Number(entry.conversions ?? 0),
        revenueAttributed: Number(entry.revenueAttributed ?? 0),
        contributionRate: Number(entry.contributionRate ?? 0),
      }))
    }

    const totalConversions = Number(metrics?.conversions ?? 0)

    return topProductsRows.map((entry) => ({
      productId: String(entry.productId),
      productName: entry.productName || null,
      conversions: Number(entry.conversions ?? 0),
      revenueAttributed: Number(entry.revenueAttributed ?? 0),
      contributionRate: totalConversions > 0
        ? (Number(entry.conversions ?? 0) / totalConversions) * 100
        : 0,
    }))
  }, [metrics, topProductsRows])

  const activatedOfferRows = useMemo(() => {
    return activatedOffers.flatMap((campaign) => {
      const status = normalizeDiscountStatus(campaign.status)
      if (!status) {
        return []
      }

      const targetUserIds = normalizeIdList(campaign.targetUserIds)

      return [{
        id: campaign.id,
        name: campaign.name,
        status,
        scope: campaign.scope,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
        minOrderAmount: campaign.minOrderAmount,
        maxRedemptions: campaign.maxRedemptions,
        stackable: campaign.stackable,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        targetUserIds,
      }]
    })
  }, [activatedOffers])

  const activeOfferRows = useMemo(
    () => activatedOfferRows.filter((row) => row.status === DISCOUNT_STATUS.ACTIVE),
    [activatedOfferRows],
  )

  const draftOfferRows = useMemo(
    () => activatedOfferRows.filter((row) => row.status === DISCOUNT_STATUS.DRAFT),
    [activatedOfferRows],
  )

  const userSpecificActiveOfferCount = useMemo(
    () => activatedOfferRows.filter((row) => row.targetUserIds.length > 0).length,
    [activatedOfferRows],
  )

  const activeOfferCount = activeOfferRows.length
  const draftOfferCount = draftOfferRows.length
  const metricsWindowDays = Number(metrics?.period?.days ?? (Number(days) || 7))

  const sortedTopOfferRows = useMemo(() => {
    const rows = [...topOfferPerformanceRows]

    rows.sort((left, right) => {
      if (offerSortBy === 'revenue') {
        const revenueDiff = Number(right.revenueAttributed ?? 0) - Number(left.revenueAttributed ?? 0)
        if (revenueDiff !== 0) {
          return revenueDiff
        }
      }

      const conversionDiff = Number(right.conversions ?? 0) - Number(left.conversions ?? 0)
      if (conversionDiff !== 0) {
        return conversionDiff
      }

      return Number(right.revenueAttributed ?? 0) - Number(left.revenueAttributed ?? 0)
    })

    return rows.slice(0, 5)
  }, [offerSortBy, topOfferPerformanceRows])

  const sourceConversionRows = useMemo(() => {
    return [...bySourceRows]
      .sort((left, right) => Number(right.conversions ?? 0) - Number(left.conversions ?? 0))
      .slice(0, 5)
  }, [bySourceRows])

  const metricsKpis = useMemo(() => {
    const impressions = Number(metrics?.impressions ?? 0)
    const clicks = Number(metrics?.clicks ?? 0)
    const conversions = Number(metrics?.conversions ?? 0)
    const ctr = Number(metrics?.CTR ?? 0)
    const conversionRate = Number(metrics?.conversionRate ?? 0)
    const revenueAttributed = Number(metrics?.revenueAttributed ?? 0)

    const adminForcedImpressions = Number(metrics?.adminForced?.impressions ?? 0)
    const adminForcedClicks = Number(metrics?.adminForced?.clicks ?? 0)
    const adminForcedConversions = Number(metrics?.adminForced?.conversions ?? 0)

    const previousImpressions = Number(metrics?.previousPeriod?.impressions ?? 0)
    const previousClicks = Number(metrics?.previousPeriod?.clicks ?? 0)
    const previousConversions = Number(metrics?.previousPeriod?.conversions ?? 0)
    const previousCtr = Number(metrics?.previousPeriod?.CTR ?? 0)
    const previousConversionRate = Number(metrics?.previousPeriod?.conversionRate ?? 0)
    const previousRevenueAttributed = Number(metrics?.previousPeriod?.revenueAttributed ?? 0)
    const previousAdminForcedConversions = Number(metrics?.previousPeriod?.adminForced?.conversions ?? 0)

    const previousBySourceRows = Array.isArray(metrics?.previousPeriod?.bySource)
      ? metrics.previousPeriod.bySource
      : []

    const previousTopOffers = Array.isArray(metrics?.previousPeriod?.topOfferPerformance)
      ? metrics.previousPeriod.topOfferPerformance
      : []

    const revenuePerConversion = conversions > 0 ? revenueAttributed / conversions : 0
    const revenuePerClick = clicks > 0 ? revenueAttributed / clicks : 0
    const previousRevenuePerClick = previousClicks > 0 ? previousRevenueAttributed / previousClicks : 0

    const totalConversions = conversions + adminForcedConversions
    const aiDrivenConversionShare = totalConversions > 0
      ? (conversions / totalConversions) * 100
      : 0

    const previousTotalConversions = previousConversions + previousAdminForcedConversions
    const previousAiDrivenConversionShare = previousTotalConversions > 0
      ? (previousConversions / previousTotalConversions) * 100
      : 0

    const bestSource = bySourceRows.reduce((best, entry) => {
      if (!best) {
        return entry
      }

      return Number(entry.conversionRate ?? 0) > Number(best.conversionRate ?? 0) ? entry : best
    }, null)

    const previousBestSource = previousBySourceRows.reduce((best, entry) => {
      if (!best) {
        return entry
      }

      return Number(entry.conversionRate ?? 0) > Number(best.conversionRate ?? 0) ? entry : best
    }, null)

    const topProduct = topOfferPerformanceRows[0] || null
    const previousTopProduct = previousTopOffers[0] || null

    const topProductContribution = topProduct
      ? Number(topProduct.contributionRate ?? 0)
      : 0

    const previousTopProductContribution = previousTopProduct
      ? Number(previousTopProduct.contributionRate ?? 0)
      : 0

    const totalOfferCount = activeOfferCount + draftOfferCount
    const activeOfferRatio = totalOfferCount > 0
      ? (activeOfferCount / totalOfferCount) * 100
      : 0

    const buildSparkline = (selector, fallbackPrevious, fallbackCurrent) => {
      const derived = timelineRows
        .map((entry) => Number(selector(entry) ?? 0))
        .filter((entry) => Number.isFinite(entry))

      if (derived.length > 1) {
        return derived
      }

      return [Number(fallbackPrevious ?? 0), Number(fallbackCurrent ?? 0)]
    }

    const createKpi = ({
      id,
      label,
      tone,
      currentValue,
      previousValue,
      valueFormatter,
      detail,
      sparklineSelector,
    }) => {
      const delta = calculateTrendChange(currentValue, previousValue)

      return {
        id,
        label,
        tone,
        value: valueFormatter(currentValue),
        detail,
        delta,
        trendDirection: getTrendDirection(delta),
        sparkline: buildSparkline(sparklineSelector, previousValue, currentValue),
      }
    }

    return [
      createKpi({
        id: 'impressions',
        label: 'Impressions',
        currentValue: impressions,
        previousValue: previousImpressions,
        valueFormatter: formatCount,
        detail: `${formatCount(adminForcedImpressions)} admin-forced tracked separately`,
        tone: 'neutral',
        sparklineSelector: (entry) => entry.impressions,
      }),
      createKpi({
        id: 'clicks',
        label: 'Clicks',
        currentValue: clicks,
        previousValue: previousClicks,
        valueFormatter: formatCount,
        detail: `${formatCount(adminForcedClicks)} admin-forced clicks`,
        tone: 'neutral',
        sparklineSelector: (entry) => entry.clicks,
      }),
      createKpi({
        id: 'conversions',
        label: 'Conversions',
        currentValue: conversions,
        previousValue: previousConversions,
        valueFormatter: formatCount,
        detail: `${formatCount(adminForcedConversions)} admin-forced conversions`,
        tone: 'success',
        sparklineSelector: (entry) => entry.conversions,
      }),
      createKpi({
        id: 'discount-success-rate',
        label: 'Discount Success Rate',
        currentValue: conversionRate,
        previousValue: previousConversionRate,
        valueFormatter: formatPercent,
        detail: `${formatCount(conversions)} conversions from ${formatCount(clicks)} clicks`,
        tone: 'success',
        sparklineSelector: (entry) => entry.conversionRate,
      }),
      createKpi({
        id: 'ctr',
        label: 'Click Through Rate',
        currentValue: ctr,
        previousValue: previousCtr,
        valueFormatter: formatPercent,
        detail: `${formatCount(clicks)} clicks from ${formatCount(impressions)} impressions`,
        tone: 'info',
        sparklineSelector: (entry) => entry.CTR,
      }),
      createKpi({
        id: 'revenue-attributed',
        label: 'Attributed Revenue',
        currentValue: revenueAttributed,
        previousValue: previousRevenueAttributed,
        valueFormatter: formatCurrency,
        detail: `${formatCurrency(revenuePerConversion)} per conversion`,
        tone: 'primary',
        sparklineSelector: (entry) => entry.revenueAttributed,
      }),
      createKpi({
        id: 'revenue-per-click',
        label: 'Revenue per Click',
        currentValue: revenuePerClick,
        previousValue: previousRevenuePerClick,
        valueFormatter: formatCurrency,
        detail: `Across ${formatCount(clicks)} click events`,
        tone: 'primary',
        sparklineSelector: (entry) => entry.revenuePerClick,
      }),
      createKpi({
        id: 'ai-share',
        label: 'AI-Driven Conversion Share',
        currentValue: aiDrivenConversionShare,
        previousValue: previousAiDrivenConversionShare,
        valueFormatter: formatPercent,
        detail: `${formatCount(conversions)} AI-driven vs ${formatCount(adminForcedConversions)} forced`,
        tone: 'success',
        sparklineSelector: (entry) => {
          const timelineTotal = Number(entry.conversions ?? 0) + Number(entry.adminForcedConversions ?? 0)
          if (timelineTotal <= 0) {
            return 0
          }
          return (Number(entry.conversions ?? 0) / timelineTotal) * 100
        },
      }),
      createKpi({
        id: 'best-source-rate',
        label: 'Best Source CVR',
        currentValue: Number(bestSource?.conversionRate ?? 0),
        previousValue: Number(previousBestSource?.conversionRate ?? 0),
        valueFormatter: formatPercent,
        detail: bestSource
          ? `${bestSource.source} source over ${formatCount(bestSource.impressions)} impressions`
          : 'No source-level data in this window',
        tone: 'info',
        sparklineSelector: (entry) => entry.conversionRate,
      }),
      createKpi({
        id: 'top-product-contribution',
        label: 'Top Product Contribution',
        currentValue: topProductContribution,
        previousValue: previousTopProductContribution,
        valueFormatter: formatPercent,
        detail: topProduct
          ? `${topProduct.productName || 'Unknown product'} with ${formatCount(topProduct.conversions)} conversions`
          : 'No converted products in this window',
        tone: 'info',
        sparklineSelector: () => topProductContribution,
      }),
      createKpi({
        id: 'active-offer-ratio',
        label: 'Active Offer Ratio',
        currentValue: activeOfferRatio,
        previousValue: activeOfferRatio,
        valueFormatter: formatPercent,
        detail: `${activeOfferCount} active out of ${totalOfferCount} total offers`,
        tone: 'warning',
        sparklineSelector: () => activeOfferRatio,
      }),
    ]
  }, [
    activeOfferCount,
    bySourceRows,
    draftOfferCount,
    metrics,
    timelineRows,
    topOfferPerformanceRows,
  ])

  const performanceTrendChartData = useMemo(() => ({
    labels: timelineRows.map((entry) => entry.label),
    datasets: [
      {
        label: 'Impressions',
        data: timelineRows.map((entry) => entry.impressions),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.16)',
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false,
      },
      {
        label: 'Clicks',
        data: timelineRows.map((entry) => entry.clicks),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.14)',
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false,
      },
      {
        label: 'Conversions',
        data: timelineRows.map((entry) => entry.conversions),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.14)',
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false,
      },
    ],
  }), [timelineRows])

  const performanceTrendChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  }), [])

  const revenueTrendChartData = useMemo(() => ({
    labels: timelineRows.map((entry) => entry.label),
    datasets: [
      {
        type: 'bar',
        label: 'Attributed Revenue (TND)',
        data: timelineRows.map((entry) => entry.revenueAttributed),
        backgroundColor: 'rgba(20, 184, 166, 0.36)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Revenue per Click (TND)',
        data: timelineRows.map((entry) => entry.revenuePerClick),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.14)',
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  }), [timelineRows])

  const revenueTrendChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      y: {
        beginAtZero: true,
        position: 'left',
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#94a3b8',
        },
        title: {
          display: true,
          text: 'Revenue (TND)',
          color: '#94a3b8',
        },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#94a3b8',
        },
        title: {
          display: true,
          text: 'Revenue / Click (TND)',
          color: '#94a3b8',
        },
      },
    },
  }), [])

  const offerPerformanceChartData = useMemo(() => ({
    labels: sortedTopOfferRows.map((entry) => entry.productName || `Product ${String(entry.productId).slice(0, 6)}`),
    datasets: [
      {
        label: offerSortBy === 'revenue' ? 'Revenue (TND)' : 'Conversions',
        data: sortedTopOfferRows.map((entry) => (
          offerSortBy === 'revenue'
            ? Number(entry.revenueAttributed ?? 0)
            : Number(entry.conversions ?? 0)
        )),
        borderRadius: 8,
        backgroundColor: offerSortBy === 'revenue'
          ? 'rgba(14, 165, 233, 0.42)'
          : 'rgba(34, 197, 94, 0.42)',
      },
    ],
  }), [offerSortBy, sortedTopOfferRows])

  const offerPerformanceChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    indexAxis: 'y',
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  }), [])

  const conversionSourceChartData = useMemo(() => ({
    labels: sourceConversionRows.map((entry) => entry.source),
    datasets: [
      {
        data: sourceConversionRows.map((entry) => Number(entry.conversions ?? 0)),
        backgroundColor: ['#14b8a6', '#0ea5e9', '#22c55e', '#f59e0b', '#94a3b8'],
        borderWidth: 0,
      },
    ],
  }), [sourceConversionRows])

  const conversionSourceChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
  }), [])

  const funnelMetrics = useMemo(() => {
    const impressions = Number(metrics?.impressions ?? 0)
    const clicks = Number(metrics?.clicks ?? 0)
    const conversions = Number(metrics?.conversions ?? 0)

    const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0
    const conversionFromClicks = clicks > 0 ? (conversions / clicks) * 100 : 0
    const conversionFromImpressions = impressions > 0 ? (conversions / impressions) * 100 : 0

    return {
      impressions,
      clicks,
      conversions,
      clickRate,
      conversionFromClicks,
      conversionFromImpressions,
    }
  }, [metrics])

  const funnelChartData = useMemo(() => ({
    labels: ['Impressions', 'Clicks', 'Conversions'],
    datasets: [
      {
        label: 'Funnel',
        data: [funnelMetrics.impressions, funnelMetrics.clicks, funnelMetrics.conversions],
        backgroundColor: ['rgba(20, 184, 166, 0.42)', 'rgba(14, 165, 233, 0.42)', 'rgba(34, 197, 94, 0.42)'],
        borderRadius: 8,
      },
    ],
  }), [funnelMetrics])

  const funnelChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    indexAxis: 'y',
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  }), [])

  const deleteOffer = async (campaignId, campaignName) => {
    if (!campaignId || !selectedUserId) {
      return
    }

    setDeletingOfferId(campaignId)
    setOffersError('')
    setOffersSuccess('')

    try {
      await api.delete(`/admin/discount-campaigns/${campaignId}`)
      setOffersSuccess(`Discount "${campaignName}" was deleted.`)

      await fetchActivatedOffers(selectedUserId)
      await fetchDiscountOffers(selectedUserId)
    } catch (error) {
      setOffersError(getApiErrorMessage(error, 'Unable to delete this discount.'))
    } finally {
      setDeletingOfferId('')
    }
  }

  const activateOffer = async (campaignId, campaignName) => {
    if (!campaignId || !selectedUserId) {
      return
    }

    setActivatingOfferId(campaignId)
    setOffersError('')
    setOffersSuccess('')

    try {
      await api.post(`/admin/discount-campaigns/${campaignId}/activate`)
      setOffersSuccess(`Discount "${campaignName}" is now active.`)

      setEditingActivatedOfferId('')
      setEditingActivatedOfferDraft(null)

      await fetchActivatedOffers(selectedUserId)
      await fetchDiscountOffers(selectedUserId)
    } catch (error) {
      setOffersError(getApiErrorMessage(error, 'Unable to activate this offer.'))
    } finally {
      setActivatingOfferId('')
    }
  }

  const moveOfferToDraft = async (campaignId, campaignName) => {
    if (!campaignId || !selectedUserId) {
      return
    }

    setDraftingOfferId(campaignId)
    setOffersError('')
    setOffersSuccess('')

    try {
      await api.post(`/admin/discount-campaigns/${campaignId}/draft`)
      setOffersSuccess(`Discount "${campaignName}" is now draft.`)

      setEditingActivatedOfferId('')
      setEditingActivatedOfferDraft(null)

      await fetchActivatedOffers(selectedUserId)
      await fetchDiscountOffers(selectedUserId)
    } catch (error) {
      setOffersError(getApiErrorMessage(error, 'Unable to move this offer to draft.'))
    } finally {
      setDraftingOfferId('')
    }
  }

  const startEditingActivatedOffer = (campaign) => {
    setEditingActivatedOfferId(campaign.id)
    setEditingActivatedOfferDraft({
      name: campaign.name || '',
      status: campaign.status || DISCOUNT_STATUS.DRAFT,
      discountType: campaign.discountType || 'PERCENT',
      discountValue: campaign.discountValue ?? '',
      minOrderAmount: campaign.minOrderAmount ?? '',
      maxRedemptions: campaign.maxRedemptions ?? '',
      startsAt: toDateTimeLocalInput(campaign.startsAt),
      endsAt: toDateTimeLocalInput(campaign.endsAt),
      stackable: Boolean(campaign.stackable),
    })
    setOffersError('')
    setOffersSuccess('')
  }

  const updateEditingActivatedOfferDraft = (patch) => {
    setEditingActivatedOfferDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        ...patch,
      }
    })
  }

  const dismissEditingActivatedOffer = () => {
    if (savingActivatedOfferId) {
      return
    }

    setEditingActivatedOfferId('')
    setEditingActivatedOfferDraft(null)
  }

  const saveActivatedOfferEdit = async () => {
    if (!editingActivatedOfferId || !editingActivatedOfferDraft || !selectedUserId) {
      return
    }

    const campaignName = String(editingActivatedOfferDraft.name || '').trim()
    if (!campaignName) {
      setOffersError('Campaign name is required.')
      return
    }

    const discountValue = Number(editingActivatedOfferDraft.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setOffersError('Discount value must be greater than 0.')
      return
    }

    const startsAt = normalizeDateTimeToIso(editingActivatedOfferDraft.startsAt)
    const endsAt = normalizeDateTimeToIso(editingActivatedOfferDraft.endsAt)

    if (!startsAt || !endsAt) {
      setOffersError('Start and end dates are required.')
      return
    }

    if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      setOffersError('End date must be after start date.')
      return
    }

    const payload = {
      name: campaignName,
      discountType: editingActivatedOfferDraft.discountType || 'PERCENT',
      discountValue,
      minOrderAmount: normalizeOptionalNumber(editingActivatedOfferDraft.minOrderAmount) ?? null,
      maxRedemptions: normalizeOptionalInteger(editingActivatedOfferDraft.maxRedemptions) ?? null,
      startsAt,
      endsAt,
      stackable: Boolean(editingActivatedOfferDraft.stackable),
      status: editingActivatedOfferDraft.status === DISCOUNT_STATUS.ACTIVE ? 'ACTIVE' : 'DRAFT',
    }

    setSavingActivatedOfferId(editingActivatedOfferId)
    setOffersError('')
    setOffersSuccess('')

    try {
      const response = await api.patch(
        `/admin/discount-campaigns/${editingActivatedOfferId}`,
        payload,
      )

      const updatedName = response?.data?.name || campaignName
      const updatedStatus = normalizeDiscountStatus(response?.data?.status) || editingActivatedOfferDraft.status || DISCOUNT_STATUS.DRAFT
      setOffersSuccess(`Discount "${updatedName}" was updated (${statusLabel(updatedStatus)}).`)

      setEditingActivatedOfferId('')
      setEditingActivatedOfferDraft(null)

      await fetchActivatedOffers(selectedUserId)
      await fetchDiscountOffers(selectedUserId)
    } catch (error) {
      setOffersError(getApiErrorMessage(error, 'Unable to update activated offer.'))
    } finally {
      setSavingActivatedOfferId('')
    }
  }

  const isRefreshing =
    loadingClients || loadingPreview || loadingMetrics || loadingOffers || loadingActivatedOffers

  const refreshAll = () => {
    void fetchClients(clientSearch)
    void fetchMetrics(Number(days) || 7)
    if (selectedUserId) {
      void fetchPreview(selectedUserId)
      void fetchDiscountOffers(selectedUserId)
      void fetchActivatedOffers(selectedUserId)
    }
  }

  return (
    <div className="nx-discount-suggestions">
      <PageHeader
        title="Discount Suggestions"
        subtitle="Preview AI product recommendations, generate editable discount offers, and accept campaigns in one screen."
        actions={(
          <div className="nx-utility-actions">
            <CButton color="light" className="nx-utility-btn" onClick={refreshAll} disabled={isRefreshing}>
              {isRefreshing ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilReload} className="me-1" />}
              Refresh
            </CButton>
          </div>
        )}
      />

      {clientError && (
        <CAlert color="danger" dismissible onClose={() => setClientError('')}>
          {clientError}
        </CAlert>
      )}

      {previewError && (
        <CAlert color="danger" dismissible onClose={() => setPreviewError('')}>
          {previewError}
        </CAlert>
      )}

      {metricsError && (
        <CAlert color="danger" dismissible onClose={() => setMetricsError('')}>
          {metricsError}
        </CAlert>
      )}

      {offersError && (
        <CAlert color="danger" dismissible onClose={() => setOffersError('')}>
          {offersError}
        </CAlert>
      )}

      {offersSuccess && (
        <CAlert color="success" dismissible onClose={() => setOffersSuccess('')}>
          {offersSuccess}
        </CAlert>
      )}

      {activatedOffersError && (
        <CAlert color="danger" dismissible onClose={() => setActivatedOffersError('')}>
          {activatedOffersError}
        </CAlert>
      )}

      <CCard className="mb-4 nx-fade-in overflow-hidden">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol md={6}>
              <CFormLabel htmlFor="promotion-client-search">Search Customer</CFormLabel>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  id="promotion-client-search"
                  placeholder="Type email or name…"
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                />
                <CButton
                  color="primary"
                  className="nx-utility-btn"
                  onClick={() => fetchClients(clientSearch)}
                  disabled={loadingClients}
                >
                  {loadingClients ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSearch} className="me-1" />}
                  Search
                </CButton>
              </CInputGroup>
            </CCol>

            <CCol md={4}>
              <CFormLabel htmlFor="promotion-client-select">Customer</CFormLabel>
              <CFormSelect
                id="promotion-client-select"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                disabled={loadingClients || clients.length === 0}
              >
                {clients.length === 0 ? (
                  <option value="">No customer found</option>
                ) : (
                  clients.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))
                )}
              </CFormSelect>
            </CCol>

            <CCol md={2}>
              <CButton
                color="success"
                className="w-100 nx-utility-btn"
                onClick={() => fetchPreview(selectedUserId)}
                disabled={loadingPreview || !selectedUserId}
              >
                {loadingPreview ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilCheckCircle} className="me-1" />}
                Run Preview
              </CButton>
            </CCol>
          </CRow>

          <div className="nx-preview-meta mt-3">
            <div className="nx-preview-meta-primary">
              <CBadge color="dark" className="nx-preview-meta-badge">User ID: {selectedUserId || '—'}</CBadge>
              <CBadge color="secondary" className="nx-preview-meta-badge">Email: {selectedClient?.email || '—'}</CBadge>
              <CBadge color={sourceBadgeColor(preview?.source)} className="nx-preview-meta-badge">
                Source: {preview?.source || '—'}
              </CBadge>
            </div>
            <div className="nx-preview-meta-secondary">
              <span className="nx-preview-meta-item">
                Generated:
                <strong>{formatDateTime(preview?.generatedAt)}</strong>
              </span>
              <span className="nx-preview-meta-item">
                Candidates:
                <strong>{preview?.debug?.candidateCount ?? 0}</strong>
              </span>
              <span className="nx-preview-meta-item">
                Filtered:
                <strong>{preview?.debug?.filteredCount ?? 0}</strong>
              </span>
              <span className="nx-preview-meta-item">
                Ranking:
                <strong>{preview?.debug?.rankingDuration ?? 0} ms</strong>
              </span>
            </div>
          </div>
        </CCardBody>
      </CCard>

      <DataTable
        title={`Promotion Suggestions (${recommendationRows.length})`}
        loading={loadingPreview}
        data={recommendationRows}
        emptyMessage={selectedUserId ? 'No suggestion for this customer.' : 'Select a customer to preview suggestions.'}
        columns={[
          { key: 'position', label: '#' },
          { key: 'productName', label: 'Product' },
          {
            key: 'price',
            label: 'Price',
            render: (row) => formatCurrency(row.price),
          },
          {
            key: 'stockLevel',
            label: 'Stock',
            render: (row) => (
              <CBadge color={Number(row.stockLevel) > 0 ? 'success' : 'danger'}>
                {row.stockLevel}
              </CBadge>
            ),
          },
          {
            key: 'score',
            label: 'Score',
            render: (row) => Number(row.score || 0).toFixed(3),
          },
          {
            key: 'promotionReason',
            label: 'Reason',
            render: (row) => row.promotionReason || '—',
          },
          {
            key: 'isAdminForced',
            label: 'Flags',
            render: (row) => (
              row.isAdminForced ? <CBadge color="warning">Admin forced</CBadge> : <span className="text-medium-emphasis">—</span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="nx-row-actions">
                <CButton
                  color="info"
                  size="sm"
                  className="nx-row-action-btn"
                  onClick={() => navigate(`/products/${row.productId}/details`)}
                >
                  <CIcon icon={cilChart} className="me-1" />
                  View Product
                </CButton>
              </div>
            ),
          },
        ]}
      />

      <CCard className="mb-4 nx-fade-in overflow-hidden nx-discount-offer-controls-card">
        <CCardBody>
          <div className="nx-offer-summary-strip">
            <div className="nx-offer-summary-kpis">
              <div className="nx-offer-kpi nx-offer-kpi--primary">
                <span className="nx-offer-kpi-label">Suggestions</span>
                <strong>{offerSuggestions.length}</strong>
              </div>
              <div className="nx-offer-kpi nx-offer-kpi--active">
                <span className="nx-offer-kpi-label">Active Offers</span>
                <strong>{activeOfferCount}</strong>
              </div>
              <div className="nx-offer-kpi nx-offer-kpi--draft">
                <span className="nx-offer-kpi-label">Draft Offers</span>
                <strong>{draftOfferCount}</strong>
              </div>
            </div>

            <div className="nx-offer-summary-right">
              <div className="nx-offer-summary-meta">
                <CBadge color={sourceBadgeColor(offerSource)} className="nx-offer-meta-badge">
                  Source: {offerSource || '—'}
                </CBadge>
                <CBadge color="light" textColor="dark" className="nx-offer-meta-badge">
                  User-targeted: {userSpecificActiveOfferCount}
                </CBadge>
                <CBadge color="light" textColor="dark" className="nx-offer-meta-badge">
                  Avg order: {formatCurrency(offerProfileSnapshot?.avgOrderValue || 0)}
                </CBadge>
                <CBadge color="light" textColor="dark" className="nx-offer-meta-badge">
                  Orders: {offerProfileSnapshot?.totalOrders ?? 0}
                </CBadge>
              </div>
              <CButton
                color="primary"
                size="sm"
                className="nx-utility-btn nx-offer-main-cta nx-offer-summary-cta"
                onClick={() => fetchDiscountOffers(selectedUserId)}
                disabled={!selectedUserId || loadingOffers}
              >
                {loadingOffers ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilReload} className="me-1" />}
                Generate Suggestions
              </CButton>
            </div>
          </div>
        </CCardBody>
      </CCard>

      <section className="nx-offers-section mb-4">
        <div className="nx-offers-section-header">
          <div>
            <h5 className="mb-1">AI Offer Suggestions</h5>
            <p className="small text-medium-emphasis mb-0">
              Review recommendation details, configure discount parameters, then activate or save as draft.
            </p>
          </div>
          <CBadge color="light" textColor="dark" className="nx-offers-count-badge">
            {offerSuggestions.length} suggestion{offerSuggestions.length === 1 ? '' : 's'}
          </CBadge>
        </div>

        {offerSuggestions.length === 0 ? (
          <CAlert color="light" className="mb-0">
            {selectedUserId
              ? 'No AI offers are available for this customer yet. Try refreshing or toggling all-products mode.'
              : 'Select a customer to generate AI discount offers.'}
          </CAlert>
        ) : (
          <div className="nx-offers-grid">
            {offerSuggestions.map((offer) => {
              const draft = offerDrafts[offer.suggestionId] || offer.campaignDraft || {}
              const isWorking = acceptingSuggestionId === offer.suggestionId

              return (
                <CCard key={offer.suggestionId} className="h-100 nx-fade-in overflow-hidden nx-offer-card">
                  <CCardBody className="nx-offer-card-body">
                    <section className="nx-offer-section nx-offer-section--header">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <h6 className="mb-1 nx-offer-title">{offer.title}</h6>
                          <p className="nx-offer-description text-medium-emphasis mb-0">{offer.description}</p>
                        </div>
                        <CBadge color={scopeBadgeColor(draft.scope)} className="nx-offer-type-badge">
                          {scopeLabel(draft.scope)}
                        </CBadge>
                      </div>

                      <div className="nx-offer-meta-row">
                        <span className="nx-offer-meta-item">Confidence: {formatConfidence(offer.confidence)}</span>
                        <span className="nx-offer-meta-item">Type: {draft.discountType || 'PERCENT'}</span>
                        <span className="nx-offer-meta-item">Starts: {formatDateTime(draft.startsAt)}</span>
                      </div>
                    </section>

                    <section className="nx-offer-section">
                      <p className="nx-offer-section-label">Recommendation Details</p>
                      <p className="small text-medium-emphasis mb-2">{offer.rationale}</p>

                      {Array.isArray(offer.previewProducts) && offer.previewProducts.length > 0 && (
                        <details className="nx-offer-products">
                          <summary>Top related products ({offer.previewProducts.length})</summary>
                          <div className="nx-offer-product-tags">
                            {offer.previewProducts.map((product) => (
                              <CBadge
                                key={`${offer.suggestionId}-${product.productId}`}
                                color="secondary"
                                className="nx-offer-product-tag"
                              >
                                {product.productName}
                              </CBadge>
                            ))}
                          </div>
                        </details>
                      )}
                    </section>

                    <section className="nx-offer-section">
                      <p className="nx-offer-section-label">Discount Configuration</p>
                      <CRow className="g-2 g-md-3">
                        <CCol xs={12}>
                          <CFormLabel className="nx-offer-label">Campaign Name</CFormLabel>
                          <CFormInput
                            className="nx-offer-input"
                            value={draft.name || ''}
                            onChange={(event) =>
                              updateOfferDraft(offer.suggestionId, {
                                name: event.target.value,
                              })
                            }
                          />
                        </CCol>

                        <CCol md={4} sm={6}>
                          <CFormLabel className="nx-offer-label">Discount Type</CFormLabel>
                          <CFormSelect
                            className="nx-offer-input"
                            value={draft.discountType || 'PERCENT'}
                            onChange={(event) =>
                              updateOfferDraft(offer.suggestionId, {
                                discountType: event.target.value,
                              })
                            }
                          >
                            <option value="PERCENT">Percent</option>
                            <option value="FIXED">Fixed</option>
                          </CFormSelect>
                        </CCol>

                        <CCol md={4} sm={6}>
                          <CFormLabel className="nx-offer-label">Discount Value</CFormLabel>
                          <CFormInput
                            className="nx-offer-input"
                            type="number"
                            min={0.01}
                            step={draft.discountType === 'FIXED' ? 0.01 : 0.1}
                            value={draft.discountValue ?? ''}
                            onChange={(event) =>
                              updateOfferDraft(offer.suggestionId, {
                                discountValue: event.target.value,
                              })
                            }
                          />
                        </CCol>

                        <CCol md={4} sm={12}>
                          <CFormLabel className="nx-offer-label">Min Order Amount</CFormLabel>
                          <CFormInput
                            className="nx-offer-input"
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="Optional"
                            value={draft.minOrderAmount}
                            onChange={(event) =>
                              updateOfferDraft(offer.suggestionId, {
                                minOrderAmount: event.target.value,
                              })
                            }
                          />
                        </CCol>

                        <CCol md={6} sm={12}>
                          <CFormLabel className="nx-offer-label">Max Redemptions</CFormLabel>
                          <CFormInput
                            className="nx-offer-input"
                            type="number"
                            min={1}
                            step={1}
                            placeholder="Optional"
                            value={draft.maxRedemptions}
                            onChange={(event) =>
                              updateOfferDraft(offer.suggestionId, {
                                maxRedemptions: event.target.value,
                              })
                            }
                          />
                        </CCol>

                        <CCol md={6} sm={12} className="d-flex align-items-end">
                          <CFormCheck
                            id={`stackable-${offer.suggestionId}`}
                            type="switch"
                            label="Stackable"
                            checked={Boolean(draft.stackable)}
                            onChange={(event) =>
                              updateOfferDraft(offer.suggestionId, {
                                stackable: event.target.checked,
                              })
                            }
                          />
                        </CCol>
                      </CRow>
                    </section>

                    <section className="nx-offer-section nx-offer-section--actions">
                      <p className="nx-offer-section-label">Actions</p>
                      <div className="nx-offer-actions">
                        <CButton
                          color="success"
                          size="sm"
                          className="nx-utility-btn nx-offer-main-cta"
                          onClick={() => acceptOffer(offer, true)}
                          disabled={isWorking}
                        >
                          {isWorking ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilCheckCircle} className="me-1" />}
                          Accept & Activate
                        </CButton>

                        <CButton
                          color="light"
                          variant="outline"
                          size="sm"
                          className="nx-utility-btn nx-offer-secondary-cta"
                          onClick={() => acceptOffer(offer, false)}
                          disabled={isWorking}
                        >
                          Save As Draft
                        </CButton>
                      </div>
                    </section>
                  </CCardBody>
                </CCard>
              )
            })}
          </div>
        )}
      </section>

      <CCard className="mb-4 nx-fade-in overflow-hidden border-start border-4 border-success">
        <CCardBody>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h6 className="mb-1">Discount Workflow For Selected Customer</h6>
              <p className="small text-medium-emphasis mb-0">
                Activated discounts and draft discounts are managed separately.
              </p>
            </div>
            <CButton
              color="light"
              className="nx-utility-btn"
              onClick={() => fetchActivatedOffers(selectedUserId)}
              disabled={!selectedUserId || loadingActivatedOffers}
            >
              {loadingActivatedOffers ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilReload} className="me-1" />}
              Refresh Discounts
            </CButton>
          </div>

          <DataTable
            title={`Activated Discounts (${activeOfferRows.length})`}
            loading={loadingActivatedOffers}
            data={activeOfferRows}
            emptyMessage={selectedUserId
              ? 'No activated discounts for this customer.'
              : 'Select a customer to load discounts.'}
            columns={[
              { key: 'name', label: 'Campaign' },
              {
                key: 'scope',
                label: 'Scope',
                render: (row) => (
                  <CBadge color={scopeBadgeColor(row.scope)}>
                    {scopeLabel(row.scope)}
                  </CBadge>
                ),
              },
              {
                key: 'discountValue',
                label: 'Discount',
                render: (row) => campaignDiscountLabel(row),
              },
              {
                key: 'targeting',
                label: 'Targeting',
                render: (row) => (
                  row.targetUserIds.length > 0
                    ? <CBadge color="success">User specific</CBadge>
                    : <CBadge color="secondary">All users</CBadge>
                ),
              },
              {
                key: 'window',
                label: 'Valid Window',
                render: (row) => (
                  <span className="small">
                    {formatDateTime(row.startsAt)} → {formatDateTime(row.endsAt)}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => {
                  const isDrafting = draftingOfferId === row.id
                  const isDeleting = deletingOfferId === row.id
                  const isEditing = editingActivatedOfferId === row.id
                  const isSaving = savingActivatedOfferId === row.id
                  const isActionBusy = Boolean(
                    savingActivatedOfferId ||
                    activatingOfferId ||
                    draftingOfferId ||
                    deletingOfferId,
                  )

                  return (
                    <div className="nx-row-actions">
                      <CButton
                        color="light"
                        size="sm"
                        className="nx-row-action-btn"
                        onClick={() => moveOfferToDraft(row.id, row.name)}
                        disabled={isActionBusy}
                      >
                        {isDrafting ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPencil} className="me-1" />}
                        Draft
                      </CButton>

                      <CButton
                        color={isEditing ? 'secondary' : 'info'}
                        size="sm"
                        className="nx-row-action-btn"
                        onClick={() => startEditingActivatedOffer(row)}
                        disabled={isActionBusy}
                      >
                        {isSaving ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPencil} className="me-1" />}
                        {isEditing ? 'Editing…' : 'Edit'}
                      </CButton>

                      <CButton
                        color="danger"
                        size="sm"
                        className="nx-row-action-btn"
                        onClick={() => deleteOffer(row.id, row.name)}
                        disabled={isActionBusy}
                      >
                        {isDeleting ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilXCircle} className="me-1" />}
                        Delete
                      </CButton>
                    </div>
                  )
                },
              },
            ]}
          />

          <DataTable
            title={`Draft Discounts (${draftOfferRows.length})`}
            loading={loadingActivatedOffers}
            data={draftOfferRows}
            emptyMessage={selectedUserId
              ? 'No draft discounts for this customer.'
              : 'Select a customer to load discounts.'}
            columns={[
              { key: 'name', label: 'Campaign' },
              {
                key: 'scope',
                label: 'Scope',
                render: (row) => (
                  <CBadge color={scopeBadgeColor(row.scope)}>
                    {scopeLabel(row.scope)}
                  </CBadge>
                ),
              },
              {
                key: 'discountValue',
                label: 'Discount',
                render: (row) => campaignDiscountLabel(row),
              },
              {
                key: 'targeting',
                label: 'Targeting',
                render: (row) => (
                  row.targetUserIds.length > 0
                    ? <CBadge color="success">User specific</CBadge>
                    : <CBadge color="secondary">All users</CBadge>
                ),
              },
              {
                key: 'window',
                label: 'Valid Window',
                render: (row) => (
                  <span className="small">
                    {formatDateTime(row.startsAt)} → {formatDateTime(row.endsAt)}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => {
                  const isActivating = activatingOfferId === row.id
                  const isDeleting = deletingOfferId === row.id
                  const isEditing = editingActivatedOfferId === row.id
                  const isSaving = savingActivatedOfferId === row.id
                  const isActionBusy = Boolean(
                    savingActivatedOfferId ||
                    activatingOfferId ||
                    draftingOfferId ||
                    deletingOfferId,
                  )

                  return (
                    <div className="nx-row-actions">
                      <CButton
                        color={isEditing ? 'secondary' : 'info'}
                        size="sm"
                        className="nx-row-action-btn"
                        onClick={() => startEditingActivatedOffer(row)}
                        disabled={isActionBusy}
                      >
                        {isSaving ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPencil} className="me-1" />}
                        {isEditing ? 'Editing…' : 'Edit'}
                      </CButton>

                      <CButton
                        color="success"
                        size="sm"
                        className="nx-row-action-btn"
                        onClick={() => activateOffer(row.id, row.name)}
                        disabled={isActionBusy}
                      >
                        {isActivating ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilCheckCircle} className="me-1" />}
                        Activate
                      </CButton>

                      <CButton
                        color="danger"
                        size="sm"
                        className="nx-row-action-btn"
                        onClick={() => deleteOffer(row.id, row.name)}
                        disabled={isActionBusy}
                      >
                        {isDeleting ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilXCircle} className="me-1" />}
                        Delete
                      </CButton>
                    </div>
                  )
                },
              },
            ]}
          />

          {editingActivatedOfferDraft && (
            <CCard className="mt-3 border-start border-4 border-info nx-fade-in overflow-hidden">
              <CCardBody>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div>
                    <h6 className="mb-1">Edit Offer</h6>
                    <p className="small text-medium-emphasis mb-0">
                      Update this campaign and keep its current status.
                    </p>
                  </div>
                  <CBadge color="light" textColor="dark">
                    Campaign ID: {editingActivatedOfferId}
                  </CBadge>
                  <CBadge color={statusBadgeColor(editingActivatedOfferDraft.status)}>
                    {statusLabel(editingActivatedOfferDraft.status)}
                  </CBadge>
                </div>

                <CRow className="g-3">
                  <CCol lg={6}>
                    <CFormLabel>Campaign Name</CFormLabel>
                    <CFormInput
                      value={editingActivatedOfferDraft.name || ''}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          name: event.target.value,
                        })
                      }
                    />
                  </CCol>

                  <CCol lg={3} md={6}>
                    <CFormLabel>Discount Type</CFormLabel>
                    <CFormSelect
                      value={editingActivatedOfferDraft.discountType || 'PERCENT'}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          discountType: event.target.value,
                        })
                      }
                    >
                      <option value="PERCENT">Percent</option>
                      <option value="FIXED">Fixed</option>
                    </CFormSelect>
                  </CCol>

                  <CCol lg={3} md={6}>
                    <CFormLabel>Discount Value</CFormLabel>
                    <CFormInput
                      type="number"
                      min={0.01}
                      step={editingActivatedOfferDraft.discountType === 'FIXED' ? 0.01 : 0.1}
                      value={editingActivatedOfferDraft.discountValue ?? ''}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          discountValue: event.target.value,
                        })
                      }
                    />
                  </CCol>

                  <CCol lg={3} md={6}>
                    <CFormLabel>Min Order Amount</CFormLabel>
                    <CFormInput
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Optional"
                      value={editingActivatedOfferDraft.minOrderAmount}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          minOrderAmount: event.target.value,
                        })
                      }
                    />
                  </CCol>

                  <CCol lg={3} md={6}>
                    <CFormLabel>Max Redemptions</CFormLabel>
                    <CFormInput
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Optional"
                      value={editingActivatedOfferDraft.maxRedemptions}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          maxRedemptions: event.target.value,
                        })
                      }
                    />
                  </CCol>

                  <CCol lg={3} md={6}>
                    <CFormLabel>Starts At</CFormLabel>
                    <CFormInput
                      type="datetime-local"
                      value={editingActivatedOfferDraft.startsAt || ''}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          startsAt: event.target.value,
                        })
                      }
                    />
                  </CCol>

                  <CCol lg={3} md={6}>
                    <CFormLabel>Ends At</CFormLabel>
                    <CFormInput
                      type="datetime-local"
                      value={editingActivatedOfferDraft.endsAt || ''}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          endsAt: event.target.value,
                        })
                      }
                    />
                  </CCol>

                  <CCol lg={3} md={6} className="d-flex align-items-end">
                    <CFormCheck
                      id="active-offer-stackable"
                      type="switch"
                      label="Stackable"
                      checked={Boolean(editingActivatedOfferDraft.stackable)}
                      onChange={(event) =>
                        updateEditingActivatedOfferDraft({
                          stackable: event.target.checked,
                        })
                      }
                    />
                  </CCol>
                </CRow>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <CButton
                    color="primary"
                    className="nx-utility-btn"
                    onClick={saveActivatedOfferEdit}
                    disabled={Boolean(savingActivatedOfferId)}
                  >
                    {savingActivatedOfferId
                      ? <CSpinner size="sm" className="me-1" />
                      : <CIcon icon={cilCheckCircle} className="me-1" />}
                    Save Changes
                  </CButton>

                  <CButton
                    color="light"
                    className="nx-utility-btn"
                    onClick={dismissEditingActivatedOffer}
                    disabled={Boolean(savingActivatedOfferId)}
                  >
                    Cancel Edit
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          )}
        </CCardBody>
      </CCard>

      <CCard className="mb-4 nx-fade-in overflow-hidden">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol md={3}>
              <CFormLabel htmlFor="promotion-metrics-days">Metrics Window</CFormLabel>
              <CFormSelect
                id="promotion-metrics-days"
                value={days}
                onChange={(event) => setDays(event.target.value)}
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Last {option} day{option > 1 ? 's' : ''}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CButton
                color="primary"
                className="nx-utility-btn"
                onClick={() => fetchMetrics(Number(days) || 7)}
                disabled={loadingMetrics}
              >
                {loadingMetrics ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilReload} className="me-1" />}
                Refresh Metrics
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <div className="nx-metrics-kpi-header">
        <h5>Performance and Discount Success KPIs</h5>
        <p>Engagement, conversion quality, revenue efficiency, and offer activation health with trend signals vs the previous {metricsWindowDays}-day window.</p>
      </div>

      <CRow className="mb-4 g-3 nx-metrics-kpi-grid">
        {metricsKpis.map((kpi) => (
          <CCol sm={6} lg={4} xl={3} key={kpi.id}>
            <CCard className={`h-100 nx-metrics-kpi-card nx-metrics-kpi-card--${kpi.tone}`}>
              <CCardBody className="nx-metrics-kpi-card-body">
                <div className="nx-metrics-kpi-top">
                  <div className="nx-metrics-kpi-label">{kpi.label}</div>
                  <KpiSparkline points={kpi.sparkline} tone={kpi.tone} />
                </div>
                <div className="nx-metrics-kpi-value">{kpi.value}</div>
                <div className={`nx-metrics-kpi-trend nx-metrics-kpi-trend--${kpi.trendDirection}`}>
                  <span className="nx-metrics-kpi-trend-arrow">
                    {kpi.trendDirection === 'up' ? '▲' : kpi.trendDirection === 'down' ? '▼' : '•'}
                  </span>
                  <span>{formatSignedPercent(kpi.delta)} vs previous {metricsWindowDays} days</span>
                </div>
                <div className="nx-metrics-kpi-detail">{kpi.detail}</div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      <CRow className="mb-4 g-3 nx-analytics-trends-row">
        <CCol xl={8}>
          <CCard className="h-100 nx-fade-in overflow-hidden nx-analytics-chart-card">
            <CCardBody className="nx-analytics-chart-body">
              <div className="nx-analytics-card-header">
                <h6>Performance Trend</h6>
                <p>Impressions, clicks, and conversions over time.</p>
              </div>
              <div className="nx-analytics-chart-wrap">
                <CChartLine
                  className="nx-analytics-chart"
                  height={220}
                  data={performanceTrendChartData}
                  options={performanceTrendChartOptions}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={4}>
          <CCard className="h-100 nx-fade-in overflow-hidden nx-analytics-chart-card">
            <CCardBody className="nx-analytics-chart-body">
              <div className="nx-analytics-card-header">
                <h6>Revenue Analytics</h6>
                <p>Attributed revenue and revenue-per-click evolution.</p>
              </div>
              <div className="nx-analytics-chart-wrap">
                <CChartBar
                  className="nx-analytics-chart"
                  height={220}
                  data={revenueTrendChartData}
                  options={revenueTrendChartOptions}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4 g-3 nx-analytics-offer-row">
        <CCol xl={8}>
          <CCard className="h-100 nx-fade-in overflow-hidden nx-analytics-chart-card">
            <CCardBody className="nx-analytics-chart-body">
              <div className="nx-analytics-card-header nx-analytics-card-header--split">
                <div>
                  <h6>Offer Performance Breakdown</h6>
                  <p>Top products by conversions or revenue contribution.</p>
                </div>
                <div className="nx-analytics-sort-control">
                  <CFormLabel className="mb-1">Sort by</CFormLabel>
                  <CFormSelect
                    size="sm"
                    value={offerSortBy}
                    onChange={(event) => setOfferSortBy(event.target.value)}
                  >
                    <option value="conversions">Conversions</option>
                    <option value="revenue">Revenue</option>
                  </CFormSelect>
                </div>
              </div>
              <div className="nx-analytics-chart-wrap nx-analytics-chart-wrap--short">
                <CChartBar
                  className="nx-analytics-chart"
                  height={210}
                  data={offerPerformanceChartData}
                  options={offerPerformanceChartOptions}
                />
              </div>
              <div className="nx-top-offers-list">
                {sortedTopOfferRows.length === 0 && (
                  <div className="text-medium-emphasis small">No offer performance data in this window.</div>
                )}
                {sortedTopOfferRows.map((offer) => (
                  <div className="nx-top-offer-item" key={`offer-${offer.productId}`}>
                    <div className="nx-top-offer-main">
                      <strong>{offer.productName || 'Unknown product'}</strong>
                      <span>{formatPercent(offer.contributionRate)} contribution</span>
                    </div>
                    <div className="nx-top-offer-meta">
                      <span>{formatCount(offer.conversions)} conversions</span>
                      <span>{formatCurrency(offer.revenueAttributed)} revenue</span>
                    </div>
                  </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={4}>
          <CCard className="h-100 nx-fade-in overflow-hidden nx-analytics-chart-card">
            <CCardBody className="nx-analytics-chart-body">
              <div className="nx-analytics-card-header">
                <h6>Conversion Source Mix</h6>
                <p>Where converted traffic originates.</p>
              </div>
              <div className="nx-analytics-chart-wrap nx-analytics-chart-wrap--short">
                <CChartDoughnut
                  className="nx-analytics-chart"
                  height={210}
                  data={conversionSourceChartData}
                  options={conversionSourceChartOptions}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4 g-3 nx-analytics-funnel-row">
        <CCol xl={12}>
          <CCard className="h-100 nx-fade-in overflow-hidden nx-analytics-chart-card">
            <CCardBody className="nx-analytics-chart-body">
              <div className="nx-analytics-card-header">
                <h6>Conversion Funnel</h6>
                <p>Impressions → Clicks → Conversions with stage conversion rates.</p>
              </div>

              <CRow className="g-3">
                <CCol lg={7}>
                  <div className="nx-analytics-chart-wrap nx-analytics-chart-wrap--funnel">
                    <CChartBar
                      className="nx-analytics-chart"
                      height={210}
                      data={funnelChartData}
                      options={funnelChartOptions}
                    />
                  </div>
                </CCol>

                <CCol lg={5}>
                  <div className="nx-funnel-steps">
                    <div className="nx-funnel-step nx-funnel-step--impressions">
                      <span className="nx-funnel-step-label">Impressions</span>
                      <strong>{formatCount(funnelMetrics.impressions)}</strong>
                    </div>
                    <div className="nx-funnel-step nx-funnel-step--clicks">
                      <span className="nx-funnel-step-label">Clicks</span>
                      <strong>{formatCount(funnelMetrics.clicks)}</strong>
                      <span className="nx-funnel-step-rate">{formatPercent(funnelMetrics.clickRate)} from impressions</span>
                    </div>
                    <div className="nx-funnel-step nx-funnel-step--conversions">
                      <span className="nx-funnel-step-label">Conversions</span>
                      <strong>{formatCount(funnelMetrics.conversions)}</strong>
                      <span className="nx-funnel-step-rate">{formatPercent(funnelMetrics.conversionFromClicks)} from clicks</span>
                      <span className="nx-funnel-step-rate">{formatPercent(funnelMetrics.conversionFromImpressions)} overall conversion</span>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3">
        <CCol xl={6}>
          <DataTable
            title="Performance by Source"
            loading={loadingMetrics}
            data={bySourceRows}
            emptyMessage="No source-level metrics available."
            columns={[
              { key: 'source', label: 'Source' },
              { key: 'impressions', label: 'Impressions' },
              { key: 'clicks', label: 'Clicks' },
              { key: 'conversions', label: 'Conversions' },
              {
                key: 'CTR',
                label: 'CTR',
                render: (row) => formatPercent(row.CTR),
              },
              {
                key: 'conversionRate',
                label: 'Conversion Rate',
                render: (row) => formatPercent(row.conversionRate),
              },
            ]}
          />
        </CCol>

        <CCol xl={6}>
          <DataTable
            title="Top Converting Products"
            loading={loadingMetrics}
            data={topProductsRows}
            emptyMessage="No converted promotions in this period."
            columns={[
              { key: 'productName', label: 'Product', render: (row) => row.productName || 'Unknown product' },
              { key: 'productId', label: 'Product ID' },
              { key: 'conversions', label: 'Conversions' },
              {
                key: 'revenueAttributed',
                label: 'Revenue',
                render: (row) => formatCurrency(row.revenueAttributed),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => (
                  <div className="nx-row-actions">
                    <CButton
                      color="info"
                      size="sm"
                      className="nx-row-action-btn"
                      onClick={() => navigate(`/products/${row.productId}/details`)}
                    >
                      <CIcon icon={cilChart} className="me-1" />
                      View Product
                    </CButton>
                  </div>
                ),
              },
            ]}
          />
        </CCol>
      </CRow>
    </div>
  )
}

export default DiscountSuggestions
