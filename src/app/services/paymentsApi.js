import { request } from './apiClient';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const value = obj[keys[i]];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function normalizePaymentItem(raw) {
  return {
    paymentId: String(pick(raw, 'paymentId', 'PaymentId') ?? ''),
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    requestTitle: String(pick(raw, 'requestTitle', 'RequestTitle') ?? ''),
    merchantOrderId: String(pick(raw, 'merchantOrderId', 'MerchantOrderId') ?? ''),
    paymentStatus: String(pick(raw, 'paymentStatus', 'PaymentStatus') ?? ''),
    payoutStatus: String(pick(raw, 'payoutStatus', 'PayoutStatus') ?? ''),
    amount: Number(pick(raw, 'amount', 'Amount') ?? 0),
    commision: Number(pick(raw, 'commision', 'Commision') ?? 0),
    vendorNetAmount: Number(pick(raw, 'vendorNetAmount', 'VendorNetAmount') ?? 0),
    totalAmount: Number(pick(raw, 'totalAmount', 'TotalAmount') ?? 0),
    createdAt: pick(raw, 'createdAt', 'CreatedAt'),
    paidAt: pick(raw, 'paidAt', 'PaidAt'),
    payoutReference: pick(raw, 'payoutReference', 'PayoutReference'),
    payoutCompletedAt: pick(raw, 'payoutCompletedAt', 'PayoutCompletedAt'),
    checkoutUrl: pick(raw, 'checkoutUrl', 'CheckoutUrl') ?? '',
    clientId: String(pick(raw, 'clientId', 'ClientId') ?? ''),
    vendorId: String(pick(raw, 'vendorId', 'VendorId') ?? ''),
    clientName: pick(raw, 'clientName', 'ClientName') ?? '',
    vendorName: pick(raw, 'vendorName', 'VendorName') ?? '',
  };
}

function normalizePaymentList(payload) {
  const list = Array.isArray(payload) ? payload : [];
  return list.map((item) => normalizePaymentItem(item));
}

function normalizeCheckoutResponse(raw) {
  return {
    paymentId: String(pick(raw, 'paymentId', 'PaymentId') ?? ''),
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    merchantOrderId: String(pick(raw, 'merchantOrderId', 'MerchantOrderId') ?? ''),
    paymentStatus: String(pick(raw, 'paymentStatus', 'PaymentStatus') ?? ''),
    payoutStatus: String(pick(raw, 'payoutStatus', 'PayoutStatus') ?? ''),
    amount: Number(pick(raw, 'amount', 'Amount') ?? 0),
    commision: Number(pick(raw, 'commision', 'Commision') ?? 0),
    vendorNetAmount: Number(pick(raw, 'vendorNetAmount', 'VendorNetAmount') ?? 0),
    totalAmount: Number(pick(raw, 'totalAmount', 'TotalAmount') ?? 0),
    checkoutUrl: String(pick(raw, 'checkoutUrl', 'CheckoutUrl') ?? ''),
  };
}

export async function startCheckoutApi({ requestId, token }) {
  const payload = await request(`/api/Payments/requests/${requestId}/checkout`, {
    method: 'POST',
    token,
  });
  return normalizeCheckoutResponse(payload);
}

export async function getMyPendingPaymentsApi({ token }) {
  const payload = await request('/api/Payments/my/pending', { method: 'GET', token });
  return normalizePaymentList(payload);
}

export async function getMyPaymentHistoryApi({ token }) {
  const payload = await request('/api/Payments/my/history', { method: 'GET', token });
  return normalizePaymentList(payload);
}

export async function getVendorReceivablesApi({ token }) {
  const payload = await request('/api/Payments/vendor/receivables', { method: 'GET', token });
  return normalizePaymentList(payload);
}

export async function getAdminPaymentsApi({ token }) {
  const payload = await request('/api/Payments/admin/all', { method: 'GET', token });
  return normalizePaymentList(payload);
}

export async function markPayoutPaidApi({ paymentId, payoutReference, token }) {
  const query = new URLSearchParams();
  if (payoutReference) query.set('payoutReference', payoutReference);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/Payments/${paymentId}/payout/mark-paid${suffix}`, {
    method: 'POST',
    token,
  });
}

export async function getPendingRatingsApi({ token }) {
  const payload = await request('/api/Ratings/my/pending', { method: 'GET', token });
  const list = Array.isArray(payload) ? payload : [];
  return list.map((item) => ({
    requestId: String(pick(item, 'requestId', 'RequestId') ?? ''),
    paymentId: String(pick(item, 'paymentId', 'PaymentId') ?? ''),
    requestTitle: String(pick(item, 'requestTitle', 'RequestTitle') ?? ''),
    vendorId: String(pick(item, 'vendorId', 'VendorId') ?? ''),
    vendorName: String(pick(item, 'vendorName', 'VendorName') ?? ''),
    isRequired: Boolean(pick(item, 'isRequired', 'IsRequired')),
  }));
}

export async function submitRatingApi({ requestId, stars, comment, token }) {
  return request(`/api/Ratings/requests/${requestId}`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars, comment }),
  });
}
