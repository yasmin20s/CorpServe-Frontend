import { request } from './apiClient';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const value = obj[keys[i]];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function normalizePaginated(payload) {
  const pageIndex = Number(pick(payload, 'pageIndex', 'PageIndex') ?? 1);
  const pageSize = Number(pick(payload, 'pageSize', 'PageSize') ?? 5);
  const count = Number(pick(payload, 'count', 'Count') ?? 0);
  let data = pick(payload, 'data', 'Data');
  if (!Array.isArray(data)) data = [];
  return { pageIndex, pageSize, count, data };
}

function normalizeAdminUser(raw) {
  const roleRaw = String(pick(raw, 'role', 'Role') ?? '').toLowerCase();
  const statusRaw = String(pick(raw, 'status', 'Status') ?? '').toLowerCase();
  return {
    userId: String(pick(raw, 'userId', 'UserId') ?? ''),
    fullName: String(pick(raw, 'fullName', 'FullName') ?? ''),
    email: String(pick(raw, 'email', 'Email') ?? ''),
    phoneNumber: pick(raw, 'phoneNumber', 'PhoneNumber') ?? '',
    profilePictureUrl: pick(raw, 'profilePictureUrl', 'ProfilePictureUrl') ?? '',
    role: roleRaw === 'vendor' ? 'vendor' : 'client',
    status: statusRaw === 'suspended' ? 'suspended' : 'active',
    joined: pick(raw, 'joined', 'Joined'),
    requestsCreatedCount: Number(pick(raw, 'requestsCreatedCount', 'RequestsCreatedCount') ?? 0),
    requestsHandledCount: Number(pick(raw, 'requestsHandledCount', 'RequestsHandledCount') ?? 0),
  };
}

function normalizeAdminRequest(raw) {
  const proposalsRaw = pick(raw, 'proposals', 'Proposals');
  const proposals = Array.isArray(proposalsRaw) ? proposalsRaw.map(normalizeAdminProposal) : [];
  return {
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    title: String(pick(raw, 'title', 'Title') ?? ''),
    description: String(pick(raw, 'description', 'Description') ?? ''),
    clientId: String(pick(raw, 'clientId', 'ClientId') ?? ''),
    vendorId: pick(raw, 'vendorId', 'VendorId'),
    clientName: String(pick(raw, 'clientName', 'ClientName') ?? ''),
    vendorName: pick(raw, 'vendorName', 'VendorName'),
    clientProfilePictureUrl: pick(raw, 'clientProfilePictureUrl', 'ClientProfilePictureUrl'),
    vendorProfilePictureUrl: pick(raw, 'vendorProfilePictureUrl', 'VendorProfilePictureUrl'),
    categoryName: String(pick(raw, 'categoryName', 'CategoryName') ?? ''),
    budgetMin: pick(raw, 'budgetMin', 'BudgetMin'),
    budgetMax: pick(raw, 'budgetMax', 'BudgetMax'),
    deadline: pick(raw, 'deadline', 'Deadline'),
    progress: Number(pick(raw, 'progress', 'Progress') ?? 0),
    requestStatus: String(pick(raw, 'requestStatus', 'RequestStatus') ?? ''),
    slaStatus: pick(raw, 'slaStatus', 'SlaStatus'),
    numberOfProposals: Number(pick(raw, 'numberOfProposals', 'NumberOfProposals') ?? proposals.length),
    proposals,
  };
}

function normalizeAdminProposal(raw) {
  return {
    proposalId: String(pick(raw, 'proposalId', 'ProposalId') ?? ''),
    vendorId: String(pick(raw, 'vendorId', 'VendorId') ?? ''),
    vendorName: String(pick(raw, 'vendorName', 'VendorName') ?? ''),
    proposalStatus: String(pick(raw, 'proposalStatus', 'ProposalStatus') ?? ''),
    proposalType: String(pick(raw, 'proposalType', 'ProposalType') ?? ''),
    proposedPrice: pick(raw, 'proposedPrice', 'ProposedPrice'),
    proposedDeadline: pick(raw, 'proposedDeadline', 'ProposedDeadline'),
    createdAt: pick(raw, 'createdAt', 'CreatedAt'),
    message: pick(raw, 'message', 'Message'),
  };
}

function normalizeSlaContract(raw) {
  return {
    slaContractId: String(pick(raw, 'slaContractId', 'SlaContractId') ?? ''),
    requestId: String(pick(raw, 'requestId', 'RequestId') ?? ''),
    requestTitle: String(pick(raw, 'requestTitle', 'RequestTitle') ?? ''),
    clientId: String(pick(raw, 'clientId', 'ClientId') ?? ''),
    vendorId: String(pick(raw, 'vendorId', 'VendorId') ?? ''),
    clientName: String(pick(raw, 'clientName', 'ClientName') ?? ''),
    vendorName: String(pick(raw, 'vendorName', 'VendorName') ?? ''),
    clientProfilePictureUrl: pick(raw, 'clientProfilePictureUrl', 'ClientProfilePictureUrl'),
    vendorProfilePictureUrl: pick(raw, 'vendorProfilePictureUrl', 'VendorProfilePictureUrl'),
    price: pick(raw, 'price', 'Price'),
    createdAt: pick(raw, 'createdAt', 'CreatedAt'),
    deadline: pick(raw, 'deadline', 'Deadline'),
    slaStatus: String(pick(raw, 'slaStatus', 'SlaStatus') ?? ''),
    warningLevel: String(pick(raw, 'warningLevel', 'WarningLevel') ?? ''),
    warningLevelUi: String(pick(raw, 'warningLevelUi', 'WarningLevelUi') ?? ''),
    categoryName: String(pick(raw, 'categoryName', 'CategoryName') ?? ''),
    requestProgress: Number(pick(raw, 'requestProgress', 'RequestProgress') ?? 0),
    daysRemaining: Number(pick(raw, 'daysRemaining', 'DaysRemaining') ?? 0),
    contractStatus: String(pick(raw, 'contractStatus', 'ContractStatus') ?? ''),
    description: String(pick(raw, 'description', 'Description') ?? ''),
    slaUiStatus: String(pick(raw, 'slaUiStatus', 'SlaUiStatus') ?? ''),
  };
}

export async function getAdminUsersApi({
  token,
  pageIndex = 1,
  pageSize = 5,
  role,
  search,
}) {
  const query = new URLSearchParams();
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));
  if (search && String(search).trim()) query.set('search', String(search).trim());
  if (role && role !== 'all') query.set('role', role);

  const payload = await request(`/api/AdminMonitor/users?${query.toString()}`, {
    method: 'GET',
    token,
  });

  const usersPayload = pick(payload, 'users', 'Users') || payload;
  const summaryPayload = pick(payload, 'summary', 'Summary') || {};
  const page = normalizePaginated(usersPayload);

  return {
    ...page,
    summary: {
      totalUsers: Number(pick(summaryPayload, 'totalUsers', 'TotalUsers') ?? page.count),
      activeCount: Number(pick(summaryPayload, 'activeCount', 'ActiveCount') ?? 0),
      suspendedCount: Number(pick(summaryPayload, 'suspendedCount', 'SuspendedCount') ?? 0),
      clientsCount: Number(pick(summaryPayload, 'clientsCount', 'ClientsCount') ?? 0),
      vendorsCount: Number(pick(summaryPayload, 'vendorsCount', 'VendorsCount') ?? 0),
    },
    data: page.data.map(normalizeAdminUser),
  };
}

export async function suspendAdminUserApi({ token, userId }) {
  return request(`/api/AdminMonitor/users/${encodeURIComponent(userId)}/suspend`, {
    method: 'POST',
    token,
  });
}

export async function activateAdminUserApi({ token, userId }) {
  return request(`/api/AdminMonitor/users/${encodeURIComponent(userId)}/activate`, {
    method: 'POST',
    token,
  });
}

export async function getAdminRequestsApi({
  token,
  pageIndex = 1,
  pageSize = 10,
  search,
  categoryId,
  requestStatus,
  slaStatus,
  slaDisplayFilter,
}) {
  const query = new URLSearchParams();
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));
  if (search && String(search).trim()) query.set('search', String(search).trim());
  if (categoryId) query.set('categoryId', String(categoryId));
  if (requestStatus != null && requestStatus !== '') query.set('requestStatus', String(requestStatus));
  if (slaDisplayFilter) query.set('slaDisplayFilter', String(slaDisplayFilter));
  else if (slaStatus != null && slaStatus !== '') query.set('slaStatus', String(slaStatus));

  const payload = await request(`/api/AdminMonitor/requests?${query.toString()}`, {
    method: 'GET',
    token,
  });

  const requestsPayload = pick(payload, 'requests', 'Requests') || payload;
  const summaryPayload = pick(payload, 'summary', 'Summary') || {};
  const page = normalizePaginated(requestsPayload);

  return {
    ...page,
    summary: {
      totalRequests: Number(pick(summaryPayload, 'totalRequests', 'TotalRequests') ?? page.count),
      activeCount: Number(pick(summaryPayload, 'activeCount', 'ActiveCount') ?? 0),
      pendingCount: Number(pick(summaryPayload, 'pendingCount', 'PendingCount') ?? 0),
      delayedSlaCount: Number(pick(summaryPayload, 'delayedSlaCount', 'DelayedSlaCount') ?? 0),
      avgProgress: Number(pick(summaryPayload, 'avgProgress', 'AvgProgress') ?? 0),
      totalBudgetMin: Number(pick(summaryPayload, 'totalBudgetMin', 'TotalBudgetMin') ?? 0),
      totalBudgetMax: Number(pick(summaryPayload, 'totalBudgetMax', 'TotalBudgetMax') ?? 0),
    },
    data: page.data.map(normalizeAdminRequest),
  };
}

export async function getAdminSlasApi({
  token,
  pageIndex = 1,
  pageSize = 10,
  search,
  slaStatus,
  categoryId,
  contractStatus,
}) {
  const query = new URLSearchParams();
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));
  if (search && String(search).trim()) query.set('search', String(search).trim());
  if (categoryId) query.set('categoryId', String(categoryId));
  if (contractStatus != null && contractStatus !== '') query.set('contractStatus', String(contractStatus));
  else if (slaStatus != null && slaStatus !== '') query.set('slaStatus', String(slaStatus));

  const payload = await request(`/api/AdminMonitor/slas?${query.toString()}`, {
    method: 'GET',
    token,
  });

  const contractsRaw = pick(payload, 'contracts', 'Contracts');
  const contractsPage = normalizePaginated(contractsRaw || {});

  return {
    totalSlaContracts: Number(pick(payload, 'totalSlaContracts', 'TotalSlaContracts') ?? 0),
    inProgressCount: Number(pick(payload, 'inProgressCount', 'InProgressCount') ?? 0),
    breachedCount: Number(pick(payload, 'breachedCount', 'BreachedCount') ?? 0),
    delayedCount: Number(pick(payload, 'delayedCount', 'DelayedCount') ?? 0),
    completedCount: Number(pick(payload, 'completedCount', 'CompletedCount') ?? 0),
    contracts: {
      ...contractsPage,
      data: contractsPage.data.map(normalizeSlaContract),
    },
  };
}
