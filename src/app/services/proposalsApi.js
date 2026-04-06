import { request } from './apiClient';
import { resolveActiveRequestBadges, formatRemainingDisplayForUi } from '../lib/activeRequestBadges';

/** Read first defined property (handles PascalCase API vs camelCase frontend). */
function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/**
 * Normalizes one active-contract row from GET client/vendor active-requests.
 * ASP.NET sometimes responds with PascalCase depending on config/version.
 */
function normalizeActiveRequestItem(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      requestId: '',
      title: '',
      description: '',
      price: 0,
      deadline: '',
      remainingTimeDisplay: '',
      progressPercentage: 0,
      clientName: '',
      vendorName: '',
      taskState: '',
      slaLabel: '',
      latestWorkUpdate: null,
    };
  }
  const priceVal = pick(raw, 'price', 'Price', 'contractPrice', 'ContractPrice');
  const pctVal = pick(raw, 'progressPercentage', 'ProgressPercentage');
  const remaining = pick(raw, 'remainingTimeDisplay', 'RemainingTimeDisplay');
  const deadline = pick(raw, 'deadline', 'Deadline') ?? '';
  let remainingTimeDisplay = remaining != null && remaining !== '' ? String(remaining) : '';
  if (!remainingTimeDisplay.trim() && deadline) {
    remainingTimeDisplay = formatRemainingDisplayForUi(deadline);
  }

  const row = {
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    title: String(pick(raw, 'title', 'Title', 'requestTitle', 'RequestTitle') ?? ''),
    description: String(
      pick(raw, 'description', 'Description', 'discription', 'Discription') ?? '',
    ),
    price: Number(priceVal ?? 0),
    deadline,
    remainingTimeDisplay,
    progressPercentage: Number(pctVal ?? 0),
    clientName: pick(raw, 'clientName', 'ClientName') ?? '',
    vendorName: pick(raw, 'vendorName', 'VendorName') ?? '',
    taskState: pick(raw, 'taskState', 'TaskState') ?? '',
    slaLabel: pick(raw, 'slaLabel', 'SlaLabel') ?? '',
    latestWorkUpdate: pick(raw, 'latestWorkUpdate', 'LatestWorkUpdate') ?? null,
  };

  const badges = resolveActiveRequestBadges(row);
  return { ...row, taskState: badges.taskState, slaLabel: badges.slaLabel };
}

export function normalizeSlaContractDto(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(pick(raw, 'id', 'Id') ?? ''),
    requestId: pick(raw, 'requestId', 'RequestId'),
    requestTitle: pick(raw, 'requestTitle', 'RequestTitle'),
    proposalId: pick(raw, 'proposalId', 'ProposalId'),
    clientId: pick(raw, 'clientId', 'ClientId'),
    clientName: pick(raw, 'clientName', 'ClientName'),
    vendorId: pick(raw, 'vendorId', 'VendorId'),
    vendorName: pick(raw, 'vendorName', 'VendorName'),
    contractPrice: Number(pick(raw, 'contractPrice', 'ContractPrice') ?? 0),
    createdAt: pick(raw, 'createdAt', 'CreatedAt'),
    deadline: pick(raw, 'deadline', 'Deadline'),
    slaStatus: String(pick(raw, 'slaStatus', 'SLAStatus') ?? ''),
    warningLevel: String(pick(raw, 'warningLevel', 'WarningLevel') ?? ''),
    remainingHours: Number(pick(raw, 'remainingHours', 'RemainingHours') ?? 0),
    isWarning: Boolean(pick(raw, 'isWarning', 'IsWarning')),
  };
}

function normalizePaginatedActiveRequestsPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { data: [], count: 0 };
  }
  const list = pick(payload, 'data', 'Data');
  const countRaw = pick(payload, 'count', 'Count');
  const items = Array.isArray(list) ? list.map((row) => normalizeActiveRequestItem(row)) : [];
  const count = Number(countRaw);
  return { data: items, count: Number.isFinite(count) ? count : 0 };
}

/** Backend compares task state with spaces removed (e.g. inprogress); normalize UI labels like "In Progress". */
function normalizeTaskStateQueryParam(taskState) {
  if (!taskState || taskState === 'all') return undefined;
  return String(taskState).replace(/\s+/g, '');
}

// --- Vendor endpoints ---

export function vendorAcceptProposalApi({ requestId, proposedPrice, proposedDeadline, message, token }) {
  return request('/api/Proposals/accept', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, proposedPrice, proposedDeadline, message }),
  });
}

export function vendorNegotiateProposalApi({ requestId, proposedPrice, proposedDeadline, message, token }) {
  return request('/api/Proposals/negotiate', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, proposedPrice, proposedDeadline, message }),
  });
}

export function vendorRejectProposalApi({ requestId, message, token }) {
  return request('/api/Proposals/reject', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, message }),
  });
}

export function getVendorSubmittedProposalsApi({ token, slaLabel, taskState, search, pageIndex = 1, pageSize = 10 }) {
  const query = new URLSearchParams();
  if (search?.trim()) query.set('search', search.trim());
  if (slaLabel) query.set('slaLabel', slaLabel);
  if (taskState) query.set('taskState', taskState);
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  return request(`/api/Proposals/submitted?${query.toString()}`, { method: 'GET', token });
}

// --- Client endpoints ---

export function getProposalCountApi({ requestId, token }) {
  return request(`/api/Proposals/request/${requestId}/count`, { method: 'GET', token });
}

export function getClientRequestProposalsApi({ requestId, token }) {
  return request(`/api/Proposals/request/${requestId}`, { method: 'GET', token });
}

export async function clientAcceptProposalApi({ proposalId, token }) {
  const raw = await request(`/api/Proposals/${proposalId}/client-accept`, { method: 'POST', token });
  return normalizeSlaContractDto(raw);
}

export function clientRejectProposalApi({ proposalId, token }) {
  return request(`/api/Proposals/${proposalId}/client-reject`, { method: 'POST', token });
}

export async function getClientActiveRequestsApi({ token, slaLabel, taskState, search, pageIndex = 1, pageSize = 10 }) {
  const query = new URLSearchParams();
  if (search?.trim()) query.set('search', search.trim());
  if (slaLabel) query.set('slaLabel', slaLabel);
  const ts = normalizeTaskStateQueryParam(taskState);
  if (ts) query.set('taskState', ts);
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  const raw = await request(`/api/Proposals/client-active-requests?${query.toString()}`, { method: 'GET', token });
  return normalizePaginatedActiveRequestsPayload(raw);
}

export async function getVendorActiveRequestsApi({ token, slaLabel, taskState, search, pageIndex = 1, pageSize = 10 }) {
  const query = new URLSearchParams();
  if (search?.trim()) query.set('search', search.trim());
  if (slaLabel) query.set('slaLabel', slaLabel);
  const ts = normalizeTaskStateQueryParam(taskState);
  if (ts) query.set('taskState', ts);
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  const raw = await request(`/api/Proposals/vendor-active-requests?${query.toString()}`, { method: 'GET', token });
  return normalizePaginatedActiveRequestsPayload(raw);
}

// --- SLA endpoints ---

export async function getClientSlaContractApi({ requestId, token }) {
  const raw = await request(`/api/Proposals/request/${requestId}/sla/client`, { method: 'GET', token });
  return normalizeSlaContractDto(raw);
}

export async function getVendorSlaContractApi({ requestId, token }) {
  const raw = await request(`/api/Proposals/request/${requestId}/sla/vendor`, { method: 'GET', token });
  return normalizeSlaContractDto(raw);
}
