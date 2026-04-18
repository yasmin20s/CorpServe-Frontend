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
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeQuickStats(raw = {}) {
  return {
    totalUsers: toNumber(pick(raw, 'totalUsers', 'TotalUsers')),
    totalUsersChangeThisWeek: toNumber(pick(raw, 'totalUsersChangeThisWeek', 'TotalUsersChangeThisWeek')),
    totalActiveRequests: toNumber(pick(raw, 'totalActiveRequests', 'TotalActiveRequests')),
    totalActiveRequestsChangeToday: toNumber(pick(raw, 'totalActiveRequestsChangeToday', 'TotalActiveRequestsChangeToday')),
    platformRevenue: toNumber(pick(raw, 'platformRevenue', 'PlatformRevenue')),
    revenueMoMPercent: toNumber(pick(raw, 'revenueMoMPercent', 'RevenueMoMPercent')),
    slaBreachRiskCount: toNumber(pick(raw, 'slaBreachRiskCount', 'SLABreachRiskCount')),
    slaBreachNeedAttention: Boolean(pick(raw, 'slaBreachNeedAttention', 'SlaBreachNeedAttention')),
  };
}

function normalizePlatformActivity(raw = {}) {
  return {
    day: String(toNumber(pick(raw, 'day', 'Day')) || ''),
    requests: toNumber(pick(raw, 'requests', 'Requests')),
    signups: toNumber(pick(raw, 'signups', 'Signups')),
    completed: toNumber(pick(raw, 'completed', 'Completed')),
  };
}

function normalizeUserDistribution(raw = {}) {
  return {
    totalUsers: toNumber(pick(raw, 'totalUsers', 'TotalUsers')),
    clientsPercent: toNumber(pick(raw, 'clientsPercent', 'ClientsPercent')),
    vendorsPercent: toNumber(pick(raw, 'vendorsPercent', 'VendorsPercent')),
    adminsPercent: toNumber(pick(raw, 'adminsPercent', 'AdminsPercent')),
  };
}

function normalizeServiceCategory(raw = {}) {
  return {
    categoryName: String(pick(raw, 'categoryName', 'CategoryName') ?? ''),
    percent: toNumber(pick(raw, 'percent', 'Percent')),
  };
}

function normalizePendingVendorApproval(raw = {}) {
  return {
    vendorId: String(pick(raw, 'vendorId', 'VendorId') ?? ''),
    profilePicUrl: String(pick(raw, 'profilePicUrl', 'ProfilePicUrl') ?? ''),
    vendorName: String(pick(raw, 'vendorName', 'VendorName') ?? ''),
    categoryName: String(pick(raw, 'categoryName', 'CategoryName') ?? ''),
    submittedAt: pick(raw, 'submittedAt', 'SubmittedAt') ?? null,
  };
}

function normalizeVendorPerformance(raw = {}) {
  return {
    vendorId: String(pick(raw, 'vendorId', 'VendorId') ?? ''),
    vendorName: String(pick(raw, 'vendorName', 'VendorName') ?? ''),
    completedRequests: toNumber(pick(raw, 'completedRequests', 'CompletedRequests')),
  };
}

function normalizeClientQuickStats(raw = {}) {
  return {
    activeRequests: toNumber(pick(raw, 'activeRequests', 'ActiveRequests')),
    activeRequestsChangeThisWeek: toNumber(pick(raw, 'activeRequestsChangeThisWeek', 'ActiveRequestsChangeThisWeek')),
    pendingProposals: toNumber(pick(raw, 'pendingProposals', 'PendingProposals')),
    newProposalToday: toNumber(pick(raw, 'newProposalToday', 'NewProposalToday')),
    totalSpentEGP: toNumber(pick(raw, 'totalSpentEGP', 'TotalSpentEGP')),
    totalSpentChangePercent: toNumber(pick(raw, 'totalSpentChangePercent', 'TotalSpentChangePercent')),
    completedRequests: toNumber(pick(raw, 'completedRequests', 'CompletedRequests')),
    completedRequestsThisMonth: toNumber(pick(raw, 'completedRequestsThisMonth', 'CompletedRequestsThisMonth')),
  };
}

function normalizeRequestActivity(raw = {}) {
  return {
    dayLabel: String(pick(raw, 'dayLabel', 'DayLabel') ?? ''),
    date: pick(raw, 'date', 'Date') ?? null,
    created: toNumber(pick(raw, 'created', 'Created')),
    completed: toNumber(pick(raw, 'completed', 'Completed')),
  };
}

function normalizeCategoryBreakdown(raw = {}) {
  return {
    category: String(pick(raw, 'category', 'Category') ?? ''),
    requestCount: toNumber(pick(raw, 'requestCount', 'RequestCount')),
    percentage: toNumber(pick(raw, 'percentage', 'Percentage')),
  };
}

function normalizeRecentRequest(raw = {}) {
  return {
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    title: String(pick(raw, 'title', 'Title') ?? ''),
    requestCategory: String(pick(raw, 'requestCategory', 'RequestCategory') ?? ''),
    deadline: pick(raw, 'deadline', 'Deadline') ?? null,
    budgetMin: toNumber(pick(raw, 'budgetMin', 'BudgetMin')),
    budgetMax: toNumber(pick(raw, 'budgetMax', 'BudgetMax')),
    status: String(pick(raw, 'status', 'Status') ?? ''),
    statusDisplay: String(pick(raw, 'statusDisplay', 'StatusDisplay') ?? ''),
    proposalCount: pick(raw, 'proposalCount', 'ProposalCount'),
  };
}

function normalizePendingPayment(raw = {}) {
  return {
    paymentId: String(pick(raw, 'paymentId', 'PaymentId') ?? ''),
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    requestTitle: String(pick(raw, 'requestTitle', 'RequestTitle') ?? ''),
    merchantOrderId: String(pick(raw, 'merchantOrderId', 'MerchantOrderId') ?? ''),
    amount: toNumber(pick(raw, 'amount', 'Amount')),
    commision: toNumber(pick(raw, 'commision', 'Commision')),
    totalAmount: toNumber(pick(raw, 'totalAmount', 'TotalAmount')),
    createdAt: pick(raw, 'createdAt', 'CreatedAt') ?? null,
    checkoutUrl: pick(raw, 'checkoutUrl', 'CheckoutUrl') ?? null,
  };
}

export async function getAdminDashboardApi({ token }) {
  const payload = await request('/api/Dashboard/admin', {
    method: 'GET',
    token,
  });

  const quickStatsRaw = pick(payload, 'adminQuickStats', 'AdminQuickStats') || {};
  const platformActivitiesRaw = pick(payload, 'platformActivities', 'PlatformActivities');
  const userDistributionsRaw = pick(payload, 'userDistributions', 'UserDistributions');
  const serviceCategoriesRaw = pick(payload, 'serviceCategories', 'ServiceCategories');
  const pendingVendorApprovalsRaw = pick(payload, 'pendingVendorApprovals', 'PendingVendorApprovals');
  const vendorPerformanceRaw = pick(payload, 'vendorPerformance', 'VendorPerformance');

  return {
    adminQuickStats: normalizeQuickStats(quickStatsRaw),
    platformActivities: Array.isArray(platformActivitiesRaw) ? platformActivitiesRaw.map(normalizePlatformActivity) : [],
    userDistributions: Array.isArray(userDistributionsRaw) ? userDistributionsRaw.map(normalizeUserDistribution) : [],
    serviceCategories: Array.isArray(serviceCategoriesRaw) ? serviceCategoriesRaw.map(normalizeServiceCategory) : [],
    pendingVendorApprovals: Array.isArray(pendingVendorApprovalsRaw)
      ? pendingVendorApprovalsRaw.map(normalizePendingVendorApproval)
      : [],
    vendorPerformance: Array.isArray(vendorPerformanceRaw) ? vendorPerformanceRaw.map(normalizeVendorPerformance) : [],
  };
}

export async function getClientDashboardApi({ token }) {
  const payload = await request('/api/Dashboard/client', {
    method: 'GET',
    token,
  });

  const quickStatsRaw = pick(payload, 'quickStats', 'QuickStats') || {};
  const requestActivitiesRaw = pick(payload, 'requestActivities', 'RequestActivities');
  const categoryBreakdownsRaw = pick(payload, 'categoryBreakdowns', 'CategoryBreakdowns');
  const recentRequestsRaw = pick(payload, 'recentRequests', 'RecentRequests');
  const pendingPaymentsRaw = pick(payload, 'pendingPayments', 'PendingPayments');

  return {
    quickStats: normalizeClientQuickStats(quickStatsRaw),
    requestActivities: Array.isArray(requestActivitiesRaw) ? requestActivitiesRaw.map(normalizeRequestActivity) : [],
    categoryBreakdowns: Array.isArray(categoryBreakdownsRaw) ? categoryBreakdownsRaw.map(normalizeCategoryBreakdown) : [],
    recentRequests: Array.isArray(recentRequestsRaw) ? recentRequestsRaw.map(normalizeRecentRequest) : [],
    pendingPayments: Array.isArray(pendingPaymentsRaw) ? pendingPaymentsRaw.map(normalizePendingPayment) : [],
  };
}
