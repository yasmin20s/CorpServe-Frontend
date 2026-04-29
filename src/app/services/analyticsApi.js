import { request } from './apiClient';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const value = obj[keys[i]];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

const PRESET_MAP = {
  '7days': 'Last7Days',
  '30days': 'Last30Days',
  '90days': 'Last90Days',
  custom: 'Custom',
};

function buildQuery({ rangeKey = '30days', startDateUtc, endDateUtc } = {}) {
  const params = new URLSearchParams();
  const preset = PRESET_MAP[rangeKey] || PRESET_MAP['30days'];
  params.set('rangePreset', preset);
  if (preset === 'Custom') {
    if (startDateUtc) params.set('startDateUtc', startDateUtc);
    if (endDateUtc) params.set('endDateUtc', endDateUtc);
  }
  return params.toString() ? `?${params.toString()}` : '';
}

function normalizeDateRange(raw = {}) {
  return {
    startDateUtc: pick(raw, 'startDateUtc', 'StartDateUtc') ?? null,
    endDateUtc: pick(raw, 'endDateUtc', 'EndDateUtc') ?? null,
    appliedPreset: String(pick(raw, 'appliedPreset', 'AppliedPreset') ?? ''),
    daysCount: toNumber(pick(raw, 'daysCount', 'DaysCount')),
  };
}

function normalizeClientAnalytics(raw = {}) {
  const overview = pick(raw, 'overview', 'Overview') || {};
  const spendingTrend = pick(raw, 'spendingTrend', 'SpendingTrend');
  const spendingByCategory = pick(raw, 'spendingByCategory', 'SpendingByCategory');
  const requestStatusBreakdown = pick(raw, 'requestStatusBreakdown', 'RequestStatusBreakdown');
  const vendorResponseTime = pick(raw, 'vendorResponseTime', 'VendorResponseTime');
  const topVendorsUsed = pick(raw, 'topVendorsUsed', 'TopVendorsUsed');

  return {
    dateRange: normalizeDateRange(pick(raw, 'dateRange', 'DateRange') || {}),
    overview: {
      totalRequests: toNumber(pick(overview, 'totalRequests', 'TotalRequests')),
      totalRequestsChange: toNumber(pick(overview, 'totalRequestsChange', 'TotalRequestsChange')),
      avgResponseTimeDays: toNumber(pick(overview, 'avgResponseTimeDays', 'AvgResponseTimeDays')),
      avgResponseTimeChangeDays: toNumber(pick(overview, 'avgResponseTimeChangeDays', 'AvgResponseTimeChangeDays')),
      totalSpentEGP: toNumber(pick(overview, 'totalSpentEGP', 'TotalSpentEGP')),
      totalSpentChangePercent: toNumber(pick(overview, 'totalSpentChangePercent', 'TotalSpentChangePercent')),
      serviceSuccessRatePercent: toNumber(pick(overview, 'serviceSuccessRatePercent', 'ServiceSuccessRatePercent')),
      serviceSuccessRateChangePercent: toNumber(pick(overview, 'serviceSuccessRateChangePercent', 'ServiceSuccessRateChangePercent')),
    },
    spendingTrend: Array.isArray(spendingTrend)
      ? spendingTrend.map((item) => ({
        dateUtc: pick(item, 'dateUtc', 'DateUtc') ?? null,
        label: String(pick(item, 'label', 'Label') ?? ''),
        amountEGP: toNumber(pick(item, 'amountEGP', 'AmountEGP')),
      }))
      : [],
    spendingByCategory: Array.isArray(spendingByCategory)
      ? spendingByCategory.map((item) => ({
        categoryName: String(pick(item, 'categoryName', 'CategoryName') ?? ''),
        amountEGP: toNumber(pick(item, 'amountEGP', 'AmountEGP')),
        percentage: toNumber(pick(item, 'percentage', 'Percentage')),
      }))
      : [],
    requestStatusBreakdown: Array.isArray(requestStatusBreakdown)
      ? requestStatusBreakdown.map((item) => ({
        status: String(pick(item, 'status', 'Status') ?? ''),
        count: toNumber(pick(item, 'count', 'Count')),
        percentage: toNumber(pick(item, 'percentage', 'Percentage')),
      }))
      : [],
    vendorResponseTime: Array.isArray(vendorResponseTime)
      ? vendorResponseTime.map((item) => ({
        bucket: String(pick(item, 'bucket', 'Bucket') ?? ''),
        count: toNumber(pick(item, 'count', 'Count')),
      }))
      : [],
    topVendorsUsed: Array.isArray(topVendorsUsed)
      ? topVendorsUsed.map((item) => ({
        rank: toNumber(pick(item, 'rank', 'Rank')),
        vendorId: String(pick(item, 'vendorId', 'VendorId') ?? ''),
        vendorName: String(pick(item, 'vendorName', 'VendorName') ?? ''),
        servicesCount: toNumber(pick(item, 'servicesCount', 'ServicesCount')),
        averageRating: toNumber(pick(item, 'averageRating', 'AverageRating')),
        totalSpentEGP: toNumber(pick(item, 'totalSpentEGP', 'TotalSpentEGP')),
      }))
      : [],
  };
}

function normalizeVendorAnalytics(raw = {}) {
  const overview = pick(raw, 'overview', 'Overview') || {};
  const accepted = pick(raw, 'acceptedProposalsTrend', 'AcceptedProposalsTrend');
  const retention = pick(raw, 'clientRetention', 'ClientRetention') || {};
  const ratingsDistribution = pick(raw, 'ratingsDistribution', 'RatingsDistribution') || {};
  const starsBreakdown = pick(ratingsDistribution, 'starsBreakdown', 'StarsBreakdown');
  const contracts = pick(raw, 'topPerformingContracts', 'TopPerformingContracts');

  return {
    dateRange: normalizeDateRange(pick(raw, 'dateRange', 'DateRange') || {}),
    overview: {
      proposalsSent: toNumber(pick(overview, 'proposalsSent', 'ProposalsSent')),
      winRatePercent: toNumber(pick(overview, 'winRatePercent', 'WinRatePercent')),
      winRateChangePercent: toNumber(pick(overview, 'winRateChangePercent', 'WinRateChangePercent')),
      avgContractValueEGP: toNumber(pick(overview, 'avgContractValueEGP', 'AvgContractValueEGP')),
      onTimeDeliveryPercent: toNumber(pick(overview, 'onTimeDeliveryPercent', 'OnTimeDeliveryPercent')),
      avgRating: toNumber(pick(overview, 'avgRating', 'AvgRating')),
    },
    acceptedProposalsTrend: Array.isArray(accepted)
      ? accepted.map((item) => ({
        dateUtc: pick(item, 'dateUtc', 'DateUtc') ?? null,
        label: String(pick(item, 'label', 'Label') ?? ''),
        acceptedCount: toNumber(pick(item, 'acceptedCount', 'AcceptedCount')),
      }))
      : [],
    clientRetention: {
      totalClientsServed: toNumber(pick(retention, 'totalClientsServed', 'TotalClientsServed')),
      repeatClientsCount: toNumber(pick(retention, 'repeatClientsCount', 'RepeatClientsCount')),
      repeatClientsPercent: toNumber(pick(retention, 'repeatClientsPercent', 'RepeatClientsPercent')),
    },
    ratingsDistribution: {
      averageRating: toNumber(pick(ratingsDistribution, 'averageRating', 'AverageRating')),
      totalRatingsCount: toNumber(pick(ratingsDistribution, 'totalRatingsCount', 'TotalRatingsCount')),
      starsBreakdown: Array.isArray(starsBreakdown)
        ? starsBreakdown.map((item) => ({
          stars: toNumber(pick(item, 'stars', 'Stars')),
          count: toNumber(pick(item, 'count', 'Count')),
        }))
        : [],
    },
    topPerformingContracts: Array.isArray(contracts)
      ? contracts.map((item) => ({
        clientId: String(pick(item, 'clientId', 'ClientId') ?? ''),
        clientName: String(pick(item, 'clientName', 'ClientName') ?? ''),
        service: String(pick(item, 'service', 'Service') ?? ''),
        valueEGP: toNumber(pick(item, 'valueEGP', 'ValueEGP')),
        deliveredAtUtc: pick(item, 'deliveredAtUtc', 'DeliveredAtUtc') ?? null,
        deliveryDeltaDays: toNumber(pick(item, 'deliveryDeltaDays', 'DeliveryDeltaDays')),
        deliveryStatus: String(pick(item, 'deliveryStatus', 'DeliveryStatus') ?? ''),
        rating: toNumber(pick(item, 'rating', 'Rating')),
      }))
      : [],
  };
}

function normalizeAdminAnalytics(raw = {}) {
  const overview = pick(raw, 'overview', 'Overview') || {};
  const gmv = pick(raw, 'platformGmvTrend', 'PlatformGmvTrend');
  const categories = pick(raw, 'topServiceCategories', 'TopServiceCategories');
  const growth = pick(raw, 'userGrowth', 'UserGrowth');
  const revenueSplit = pick(raw, 'revenueSplit', 'RevenueSplit') || {};
  const vendors = pick(raw, 'topVendorsByRevenue', 'TopVendorsByRevenue');
  const anomalyRiskFlags = pick(raw, 'anomalyRiskFlags', 'AnomalyRiskFlags') || {};
  const flags = pick(anomalyRiskFlags, 'flags', 'Flags');

  return {
    dateRange: normalizeDateRange(pick(raw, 'dateRange', 'DateRange') || {}),
    overview: {
      gmvEGP: toNumber(pick(overview, 'gmvEGP', 'GmvEGP')),
      gmvChangePercent: toNumber(pick(overview, 'gmvChangePercent', 'GmvChangePercent')),
      activeUsersCount: toNumber(pick(overview, 'activeUsersCount', 'ActiveUsersCount', 'activeUsers30Days', 'ActiveUsers30Days')),
      avgTimeToMatchHours: toNumber(pick(overview, 'avgTimeToMatchHours', 'AvgTimeToMatchHours')),
      slaCompliancePercent: toNumber(pick(overview, 'slaCompliancePercent', 'SlaCompliancePercent')),
    },
    platformGmvTrend: Array.isArray(gmv)
      ? gmv.map((item) => ({
        dateUtc: pick(item, 'dateUtc', 'DateUtc') ?? null,
        label: String(pick(item, 'label', 'Label') ?? ''),
        gmvEGP: toNumber(pick(item, 'gmvEGP', 'GmvEGP')),
      }))
      : [],
    topServiceCategories: Array.isArray(categories)
      ? categories.map((item) => ({
        categoryName: String(pick(item, 'categoryName', 'CategoryName') ?? ''),
        percentage: toNumber(pick(item, 'percentage', 'Percentage')),
      }))
      : [],
    userGrowth: Array.isArray(growth)
      ? growth.map((item) => ({
        monthUtc: pick(item, 'monthUtc', 'MonthUtc') ?? null,
        label: String(pick(item, 'label', 'Label') ?? ''),
        clientsCount: toNumber(pick(item, 'clientsCount', 'ClientsCount')),
        vendorsCount: toNumber(pick(item, 'vendorsCount', 'VendorsCount')),
        adminsCount: toNumber(pick(item, 'adminsCount', 'AdminsCount')),
      }))
      : [],
    revenueSplit: {
      vendorPayoutEGP: toNumber(pick(revenueSplit, 'vendorPayoutEGP', 'VendorPayoutEGP')),
      platformFeeEGP: toNumber(pick(revenueSplit, 'platformFeeEGP', 'PlatformFeeEGP')),
      vendorPayoutPercent: toNumber(pick(revenueSplit, 'vendorPayoutPercent', 'VendorPayoutPercent')),
      platformFeePercent: toNumber(pick(revenueSplit, 'platformFeePercent', 'PlatformFeePercent')),
    },
    topVendorsByRevenue: Array.isArray(vendors)
      ? vendors.map((item) => ({
        rank: toNumber(pick(item, 'rank', 'Rank')),
        vendorId: String(pick(item, 'vendorId', 'VendorId') ?? ''),
        vendorName: String(pick(item, 'vendorName', 'VendorName') ?? ''),
        revenueEGP: toNumber(pick(item, 'revenueEGP', 'RevenueEGP')),
      }))
      : [],
    anomalyRiskFlags: {
      activeFlagsCount: toNumber(pick(anomalyRiskFlags, 'activeFlagsCount', 'ActiveFlagsCount')),
      flags: Array.isArray(flags)
        ? flags.map((item) => ({
          type: String(pick(item, 'type', 'Type') ?? ''),
          entity: String(pick(item, 'entity', 'Entity') ?? ''),
          description: String(pick(item, 'description', 'Description') ?? ''),
          severity: String(pick(item, 'severity', 'Severity') ?? ''),
          detectedAtUtc: pick(item, 'detectedAtUtc', 'DetectedAtUtc') ?? null,
        }))
        : [],
    },
  };
}

export async function getClientAnalyticsApi({ token, rangeKey = '30days', startDateUtc, endDateUtc } = {}) {
  const suffix = buildQuery({ rangeKey, startDateUtc, endDateUtc });
  const payload = await request(`/api/Analytics/client${suffix}`, { method: 'GET', token });
  return normalizeClientAnalytics(payload || {});
}

export async function getVendorAnalyticsApi({ token, rangeKey = '30days', startDateUtc, endDateUtc } = {}) {
  const suffix = buildQuery({ rangeKey, startDateUtc, endDateUtc });
  const payload = await request(`/api/Analytics/vendor${suffix}`, { method: 'GET', token });
  return normalizeVendorAnalytics(payload || {});
}

export async function getAdminAnalyticsApi({ token, rangeKey = '30days', startDateUtc, endDateUtc } = {}) {
  const suffix = buildQuery({ rangeKey, startDateUtc, endDateUtc });
  const payload = await request(`/api/Analytics/admin${suffix}`, { method: 'GET', token });
  return normalizeAdminAnalytics(payload || {});
}
