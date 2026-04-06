const STORAGE_KEY = 'corpserve-vendor-requests-ui-store-v1';

const SEEDED_UPDATE_TEXTS = new Set([
  'Firewall rule audit completed for HQ and 2 branch offices.',
  'Core API mapping done, currently validating edge-case transactions.',
  'Data integrity script flagged 3,200 rows pending correction.',
  'Waiting for client-side network window approval to continue deployment.',
]);

const HOURS_TO_MS = 60 * 60 * 1000;

const toIsoAfterHours = (hours) => new Date(Date.now() + hours * HOURS_TO_MS).toISOString();
const toIsoBeforeHours = (hours) => new Date(Date.now() - hours * HOURS_TO_MS).toISOString();

function buildDefaultStore() {
  return {
    activeRequests: [
      {
        id: 'vr-101',
        title: 'Network Security Hardening',
        client: 'Meridian Finance',
        category: 'Cybersecurity',
        budget: 'EGP 24,000',
        deadline: toIsoAfterHours(120),
        progress: 45,
        slaStatus: 'Inprogress',
        suspendedBy: null,
        description:
          'Harden firewall and endpoint policies for all branch offices, including vulnerability patching and baseline security checks.',
        lastUpdate: '',
      },
      {
        id: 'vr-102',
        title: 'ERP Integration Support',
        client: 'Nile Commerce Group',
        category: 'IT Integration',
        budget: 'EGP 17,500',
        deadline: toIsoAfterHours(38),
        progress: 72,
        slaStatus: 'Inprogress',
        suspendedBy: null,
        description:
          'Connect inventory and accounting modules with purchase order flow and validate data synchronization across departments.',
        lastUpdate: '',
      },
      {
        id: 'vr-103',
        title: 'Data Migration Quality Check',
        client: 'Blue Orbit Logistics',
        category: 'Data Services',
        budget: 'EGP 9,800',
        deadline: toIsoBeforeHours(16),
        progress: 58,
        slaStatus: 'Delayed',
        suspendedBy: null,
        description:
          'Review migrated records, resolve schema mismatch issues, and submit clean-up report before handover.',
        lastUpdate: '',
      },
      {
        id: 'vr-104',
        title: 'Branch Router Replacement',
        client: 'East Delta Retail',
        category: 'Infrastructure',
        budget: 'EGP 13,200',
        deadline: toIsoAfterHours(52),
        progress: 31,
        slaStatus: 'Delayed',
        suspendedBy: 'client',
        description:
          'Replace legacy routers, update VPN profiles, and stabilize branch connectivity with failover support.',
        lastUpdate: '',
      },
    ],
    completedRequests: [
      {
        id: 'cp-201',
        title: 'Office Cleaning Service',
        client: 'TechCorp',
        amount: 'EGP 2,800',
        completedDate: '2026-03-01',
        rating: 5,
        feedback: 'Excellent service!'
      },
      {
        id: 'cp-202',
        title: 'Logo Design',
        client: 'StartupABC',
        amount: 'EGP 1,500',
        completedDate: '2026-02-20',
        rating: 4,
        feedback: 'Great work, very professional'
      },
      {
        id: 'cp-203',
        title: 'Security Audit',
        client: 'FinanceInc',
        amount: 'EGP 8,500',
        completedDate: '2026-02-10',
        rating: 5,
        feedback: 'Thorough and detailed audit'
      },
    ],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidStore(store) {
  return Boolean(store) && Array.isArray(store.activeRequests) && Array.isArray(store.completedRequests);
}

function sanitizeStore(store) {
  const next = clone(store);

  next.activeRequests = next.activeRequests.map((request) => {
    if (!SEEDED_UPDATE_TEXTS.has(request.lastUpdate)) return request;
    return {
      ...request,
      lastUpdate: '',
    };
  });

  return next;
}

export function getVendorRequestsUiStore() {
  if (typeof window === 'undefined') {
    return buildDefaultStore();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = buildDefaultStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const parsed = JSON.parse(raw);
    if (!isValidStore(parsed)) {
      const defaults = buildDefaultStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const sanitized = sanitizeStore(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return sanitized;
  } catch {
    const defaults = buildDefaultStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveVendorRequestsUiStore(store) {
  if (typeof window === 'undefined') return;

  if (!isValidStore(store)) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function updateVendorRequestsUiStore(updater) {
  const current = getVendorRequestsUiStore();
  const draft = clone(current);
  const next = updater(draft);
  const safeStore = isValidStore(next) ? next : current;
  saveVendorRequestsUiStore(safeStore);
  return safeStore;
}
