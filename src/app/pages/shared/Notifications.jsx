import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  AlertCircle,
  FileText,
  CreditCard,
  CheckCheck,
  FileStack,
  Clock,
  Check,
  CheckCircle,
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  Activity,
  Wallet,
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  UserCheck,
  TriangleAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSignalREvent } from '../../context/SignalRContext';
import {
  getMyNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../../services/notificationsApi';
import { formatRelativeTime, getNotificationPeriodBucket } from '../../lib/formatRelativeTime';
import { toast } from '../../lib/toast';

const PAGE_SIZE = 10;

/** Matches CorpServe.Shared.Notifications.NotificationTitles — request browse vs active work */
const REQUEST_BROWSE_TITLES = new Set([
  'Request created',
  'Request updated',
  'Request deleted',
  'New request available',
]);

/** Active execution / risk — list pages (not contract deep link) */
const REQUEST_ACTIVE_WORK_TITLES = new Set([
  'Proposal accepted',
  'Request progress updated',
  'SLA blocked',
  'SLA delayed',
  'SLA deadline warning',
]);

const TITLE_NEW_PROPOSAL = 'New proposal received';

const TITLE_SLA_CREATED = 'SLA created';
const TITLE_SLA_COMPLETED = 'SLA completed';

const COMPLETED_SLA_TITLES = new Set([TITLE_SLA_CREATED, TITLE_SLA_COMPLETED]);

const SLA_WARN_TITLES = new Set([
  'SLA deadline warning',
  'SLA delayed',
  'SLA blocked',
]);

function normalizeNotificationTitle(title) {
  return String(title ?? '').trim();
}

function extractRequestId(n) {
  const url = String(n.navigateUrl || '').trim();
  const m = url.match(/^\/requests\/([^/]+)\/?$/i);
  if (m) return m[1];
  const rid = n.relatedEntityId != null ? String(n.relatedEntityId).trim() : '';
  return rid;
}

/** @param {'client' | 'vendor' | string} role */
function pathForRequestNotification(role, title) {
  const r = (role || 'client').toLowerCase();
  const t = normalizeNotificationTitle(title);

  if (t === TITLE_SLA_COMPLETED && r === 'client') {
    return '/client/payments';
  }

  if (REQUEST_ACTIVE_WORK_TITLES.has(t)) {
    if (r === 'client') return '/client/active-requests';
    if (r === 'vendor') return '/vendor/active-requests';
  }

  if (REQUEST_BROWSE_TITLES.has(t)) {
    if (r === 'client') return '/client/my-requests';
    if (r === 'vendor') return '/vendor/available-requests';
  }

  if (r === 'client') return '/client/my-requests';
  if (r === 'vendor') return '/vendor/available-requests';
  return getDashboardPathForRole(role);
}

const clientMenuItems = [
  { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5" /> },
  { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5" /> },
  { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5" /> },
  { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5" /> },
];

const vendorMenuItems = [
  { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5" /> },
  { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

const adminMenuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Vendor Approvals', path: '/admin/vendor-approvals', icon: <UserCheck className="w-5 h-5" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Categories', path: '/admin/categories', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Requests Monitor', path: '/admin/requests-monitor', icon: <FileText className="w-5 h-5" /> },
  { label: 'SLA Monitor', path: '/admin/sla-monitor', icon: <FileText className="w-5 h-5" /> },
  { label: 'Payments Monitor', path: '/admin/payments-monitor', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

function menuItemsForRole(role) {
  const r = (role || 'client').toLowerCase();
  if (r === 'vendor') return vendorMenuItems;
  if (r === 'admin') return adminMenuItems;
  return clientMenuItems;
}

function getDashboardPathForRole(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
}

/** @param {string | null | undefined} relatedEntityType */
function getDisplayCategory(relatedEntityType) {
  const t = String(relatedEntityType ?? '').trim();
  const upper = t.toUpperCase();
  if (upper === 'PAYMENT' || upper === 'INVOICE') return 'payment';
  if (upper === 'SLACONTRACT' || t === 'SLAContract') return 'sla';
  if (upper === 'PROPOSAL' || t === 'Proposal') return 'quote';
  if (upper === 'REQUEST' || t === 'Request') return 'request';
  return 'system';
}

function resolveNotificationNavigatePath(navigateUrl, role, notificationTitle) {
  const r = (role || 'client').toLowerCase();
  const path = typeof navigateUrl === 'string' ? navigateUrl.trim() : '';
  if (!path) return null;

  let m = path.match(/^\/vendor-verification\/([^/]+)\/?$/i);
  if (m) return `/vendor-verification/${m[1]}`;

  m = path.match(/^\/proposals\/request\/([^/]+)\/sla\/?$/i);
  if (m && r === 'client') return '/client/active-requests';
  if (m && r === 'vendor') return '/vendor/active-requests';

  m = path.match(/^\/proposals\/([^/]+)\/?$/i);
  if (m && r === 'client') return `/client/proposals/${m[1]}`;
  if (m && r === 'vendor') return '/vendor/active-requests';

  m = path.match(/^\/requests\/([^/]+)\/?$/i);
  if (m) {
    if (r === 'admin') return '/admin/requests-monitor';
    return pathForRequestNotification(r, notificationTitle);
  }

  if (path === '/profile' || path === '/profile/') {
    return `/${r}/profile`;
  }

  if (/^\/payments?\b/i.test(path) || /\/invoice\b/i.test(path)) {
    if (r === 'client') return '/client/payments';
    if (r === 'admin') return '/admin/payments-monitor';
  }

  return null;
}

function defaultPathForCategory(category, role, notificationTitle) {
  const r = (role || 'client').toLowerCase();
  if (category === 'payment') {
    if (r === 'client') return '/client/payments';
    if (r === 'admin') return '/admin/payments-monitor';
  }
  if (category === 'request') {
    return pathForRequestNotification(role, notificationTitle);
  }
  if (category === 'quote' && r === 'vendor') {
    return '/vendor/active-requests';
  }
  return getDashboardPathForRole(role);
}

function getNotificationTarget(n, role) {
  const r = (role || 'client').toLowerCase();
  const t = normalizeNotificationTitle(n.title);
  const requestId = extractRequestId(n);

  if (requestId && t === TITLE_NEW_PROPOSAL && r === 'client') {
    return { path: `/client/proposals/${requestId}` };
  }

  if (requestId && t === TITLE_SLA_CREATED && r === 'client') {
    return { path: '/client/active-requests' };
  }

  if (requestId && t === TITLE_SLA_COMPLETED && r === 'client') {
    return { path: '/client/payments' };
  }

  if (
    requestId &&
    (t === TITLE_SLA_CREATED || t === TITLE_SLA_COMPLETED) &&
    r === 'vendor'
  ) {
    return {
      path: '/vendor/active-requests',
      state: { openSlaForRequestId: requestId },
    };
  }

  const resolved = resolveNotificationNavigatePath(
    n.navigateUrl,
    r,
    t
  );
  if (resolved) return { path: resolved };

  const cat = getDisplayCategory(n.relatedEntityType);
  return { path: defaultPathForCategory(cat, r, t) };
}

function getNotificationVisual(n) {
  const t = normalizeNotificationTitle(n.title);
  const cat = getDisplayCategory(n.relatedEntityType);
  if (cat === 'payment') return 'payment';
  if (t === TITLE_NEW_PROPOSAL) return 'newProposal';
  if (COMPLETED_SLA_TITLES.has(t)) return 'completed';
  if (SLA_WARN_TITLES.has(t)) return 'slaWarn';
  if (cat === 'sla' && !SLA_WARN_TITLES.has(t)) return 'completed';
  if (cat === 'quote') return 'proposalPurple';
  if (cat === 'system') return 'system';
  if (cat === 'request') {
    if (REQUEST_BROWSE_TITLES.has(t)) return 'browse';
    if (REQUEST_ACTIVE_WORK_TITLES.has(t)) return 'active';
    return 'browse';
  }
  return 'default';
}

const VISUAL_STYLES = {
  payment: {
    card: 'bg-[#FFFBEB] border-amber-200 shadow-amber-100/20',
    iconWrap: 'bg-amber-100 text-amber-600',
    icon: 'alert',
    newPill: 'indigo',
  },
  newProposal: {
    card: 'bg-[#FAF5FF] border-violet-200/90 shadow-violet-100/25',
    iconWrap: 'bg-violet-100 text-violet-600',
    icon: 'clock',
    newPill: 'violet',
  },
  completed: {
    card: 'bg-[#F0FDF4] border-emerald-200/90 shadow-emerald-100/25',
    iconWrap: 'bg-emerald-100 text-emerald-700',
    icon: 'checkCheck',
    newPill: 'violet',
  },
  slaWarn: {
    card: 'bg-amber-50/95 border-amber-200 shadow-amber-100/30',
    iconWrap: 'bg-amber-100 text-amber-700',
    icon: 'triangle',
    newPill: 'amber',
  },
  proposalPurple: {
    card: 'bg-[#FAF5FF] border-violet-200/90 shadow-violet-100/25',
    iconWrap: 'bg-violet-100 text-violet-600',
    icon: 'clock',
    newPill: 'violet',
  },
  system: {
    card: 'bg-[#F8FAFC] border-slate-200 shadow-slate-100/20',
    iconWrap: 'bg-slate-200 text-slate-600',
    icon: 'shield',
    newPill: 'indigo',
  },
  browse: {
    card: 'bg-sky-50/90 border-sky-200/85 shadow-sky-100/20',
    iconWrap: 'bg-sky-100 text-sky-700',
    icon: 'fileStack',
    newPill: 'indigo',
  },
  active: {
    card: 'bg-indigo-50/80 border-indigo-200/80 shadow-indigo-100/20',
    iconWrap: 'bg-indigo-100 text-indigo-700',
    icon: 'activity',
    newPill: 'indigo',
  },
  default: {
    card: 'bg-slate-50 border-slate-200/90 shadow-slate-100/15',
    iconWrap: 'bg-slate-200 text-slate-600',
    icon: 'clock',
    newPill: 'indigo',
  },
};

function renderNotificationIcon(kind) {
  switch (kind) {
    case 'alert':
      return <AlertCircle size={26} strokeWidth={2.5} />;
    case 'checkCheck':
      return <CheckCheck size={26} strokeWidth={2.5} />;
    case 'triangle':
      return <TriangleAlert size={26} strokeWidth={2.5} />;
    case 'shield':
      return <ShieldCheck size={26} strokeWidth={2.5} />;
    case 'fileStack':
      return <FileStack size={26} strokeWidth={2.5} />;
    case 'activity':
      return <Activity size={26} strokeWidth={2.5} />;
    case 'clock':
    default:
      return <Clock size={26} strokeWidth={2.5} />;
  }
}

function newUpdatePillClass(pill) {
  if (pill === 'violet') {
    return 'text-violet-600 bg-violet-50 px-2 py-1 rounded-full border border-violet-100 animate-pulse';
  }
  if (pill === 'amber') {
    return 'text-amber-800 bg-amber-100 px-2 py-1 rounded-full border border-amber-200 animate-pulse';
  }
  return 'text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 animate-pulse';
}

function getNotificationAction(n, role) {
  const target = getNotificationTarget(n, role);
  const t = normalizeNotificationTitle(n.title);
  const r = (role || 'client').toLowerCase();
  const cat = getDisplayCategory(n.relatedEntityType);
  const vis = getNotificationVisual(n);

  const mintBtn =
    'bg-emerald-50 text-emerald-800 border-2 border-emerald-200/80 hover:bg-emerald-100/80';
  const violetBtn =
    'bg-violet-50 text-violet-800 border-2 border-violet-200 hover:bg-violet-100/70';
  const warnBtn =
    'bg-amber-50 text-amber-900 border-2 border-amber-200 hover:bg-amber-100/80';
  const skyBtn =
    'bg-sky-50 text-sky-800 border-2 border-sky-200 hover:bg-sky-100/80';
  const indigoBtn =
    'bg-indigo-50 text-indigo-800 border-2 border-indigo-200 hover:bg-indigo-100/70';

  if (cat === 'payment') {
    return {
      ...target,
      text: 'Pay Now',
      icon: <CreditCard size={16} />,
      className:
        'bg-[#E65100] hover:bg-[#BF360C] text-white shadow-orange-200 border-none',
    };
  }

  if (vis === 'newProposal') {
    return {
      ...target,
      text: 'Review proposal',
      icon: <FileText size={16} />,
      className: violetBtn,
    };
  }

  if (vis === 'completed') {
    const nt = normalizeNotificationTitle(n.title);
    if (r === 'client' && nt === TITLE_SLA_COMPLETED) {
      return {
        ...target,
        text: 'View payments',
        icon: <Wallet size={16} />,
        className: mintBtn,
      };
    }
    const clientUsesActiveList =
      r === 'client' &&
      (target.path === '/client/active-requests' ||
        String(target.path || '').startsWith('/client/active-requests'));
    return {
      ...target,
      text: clientUsesActiveList ? 'View active requests' : 'View contract',
      icon: clientUsesActiveList ? (
        <Activity size={16} />
      ) : (
        <FileText size={16} />
      ),
      className: mintBtn,
    };
  }

  if (vis === 'slaWarn') {
    return {
      ...target,
      text: 'View active requests',
      icon: <TriangleAlert size={16} />,
      className: warnBtn,
    };
  }

  if (vis === 'proposalPurple') {
    const isVendor = r === 'vendor';
    return {
      ...target,
      text: isVendor ? 'View active requests' : 'Review proposal',
      icon: <FileText size={16} />,
      className: violetBtn,
    };
  }

  if (vis === 'system') {
    return {
      ...target,
      text: 'Learn more',
      icon: <ShieldCheck size={16} />,
      className:
        'bg-slate-200/50 text-slate-700 border-2 border-slate-300 hover:bg-slate-300/50',
    };
  }

  if (vis === 'browse') {
    if (r === 'vendor') {
      return {
        ...target,
        text: 'Available requests',
        icon: <Briefcase size={16} />,
        className: skyBtn,
      };
    }
    return {
      ...target,
      text: 'My requests',
      icon: <FileStack size={16} />,
      className: skyBtn,
    };
  }

  if (vis === 'active') {
    return {
      ...target,
      text: 'View active requests',
      icon: <Activity size={16} />,
      className: indigoBtn,
    };
  }

  return {
    ...target,
    text: 'Open',
    icon: <Clock size={16} />,
    className:
      'bg-slate-100 text-slate-800 border-2 border-slate-200 hover:bg-slate-200/60',
  };
}

async function syncUnreadBadge(token) {
  try {
    const result = await getUnreadNotificationCountApi({ token });
    const n =
      typeof result === 'number'
        ? result
        : Number(result?.data ?? result?.count ?? 0);
    const safe = Number.isFinite(n) ? Math.max(0, n) : 0;
    window.dispatchEvent(
      new CustomEvent('corpserve:notification-unread-sync', { detail: safe })
    );
  } catch {
    /* ignore */
  }
}

function normalizeNotificationDto(raw) {
  const id = raw?.id ?? raw?.Id ?? '';
  return {
    id,
    title: raw?.title ?? raw?.Title ?? '',
    message: raw?.message ?? raw?.Message ?? '',
    type: raw?.type ?? raw?.Type ?? 'Info',
    isRead: Boolean(raw?.isRead ?? raw?.IsRead),
    createdAt: raw?.createdAt ?? raw?.CreatedAt ?? '',
    relatedEntityId: raw?.relatedEntityId ?? raw?.RelatedEntityId ?? null,
    relatedEntityType: raw?.relatedEntityType ?? raw?.RelatedEntityType ?? null,
    navigateUrl: raw?.navigateUrl ?? raw?.NavigateUrl ?? '',
  };
}

function parsePaginatedResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    return { data: [], count: 0, pageIndex: 1, pageSize: PAGE_SIZE };
  }
  const data = payload.data ?? payload.Data ?? [];
  const count = payload.count ?? payload.Count ?? 0;
  const pageIndex = payload.pageIndex ?? payload.PageIndex ?? 1;
  const pageSize = payload.pageSize ?? payload.PageSize ?? PAGE_SIZE;
  const list = Array.isArray(data) ? data.map(normalizeNotificationDto) : [];
  return {
    data: list,
    count: typeof count === 'number' ? count : 0,
    pageIndex: typeof pageIndex === 'number' ? pageIndex : 1,
    pageSize: typeof pageSize === 'number' ? pageSize : PAGE_SIZE,
  };
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = user?.token;
  const userRole = (user?.role || 'client').toLowerCase();
  const menuItems = menuItemsForRole(userRole);

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60000);
    const onVis = () => {
      if (document.visibilityState === 'visible') setNowTick(Date.now());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const fetchPage = useCallback(
    async (page, append) => {
      if (!token) return;
      const isAppend = append && page > 1;
      if (isAppend) setLoadingMore(true);
      else setLoading(true);

      try {
        const raw = await getMyNotificationsApi({
          token,
          pageIndex: page,
          pageSize: PAGE_SIZE,
        });
        const { data, count } = parsePaginatedResponse(raw);
        setTotalCount(count);
        setPageIndex(page);
        setLoadError('');

        if (append && page > 1) {
          setItems((prev) => {
            const seen = new Set(prev.map((x) => x.id));
            const merged = [...prev];
            for (const row of data) {
              if (row.id && !seen.has(row.id)) {
                seen.add(row.id);
                merged.push(row);
              }
            }
            return merged;
          });
        } else {
          setItems(data);
        }
      } catch (e) {
        const msg = e?.message || 'Failed to load notifications';
        setLoadError(msg);
        if (!append) setItems([]);
        toast.error(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setItems([]);
      return;
    }
    fetchPage(1, false);
  }, [token, fetchPage]);

  const onRealtimeNotification = useCallback((raw) => {
    const row = normalizeNotificationDto(raw);
    if (!row.id) return;
    let inserted = false;
    setItems((prev) => {
      if (prev.some((x) => x.id === row.id)) return prev;
      inserted = true;
      return [row, ...prev];
    });
    if (inserted) setTotalCount((c) => c + 1);
  }, []);

  useSignalREvent(null, onRealtimeNotification);

  const hasMore = items.length < totalCount;

  const grouped = useMemo(() => {
    const today = [];
    const yesterday = [];
    const older = [];
    for (const n of items) {
      const bucket = getNotificationPeriodBucket(n.createdAt);
      if (bucket === 'Today') today.push(n);
      else if (bucket === 'Yesterday') yesterday.push(n);
      else older.push(n);
    }
    return { today, yesterday, older };
  }, [items]);

  const handleMarkRead = async (n) => {
    if (!token || n.isRead) return;
    try {
      await markNotificationReadApi({ notificationId: n.id, token });
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      await syncUnreadBadge(token);
    } catch (e) {
      toast.error(e?.message || 'Could not mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || markAllLoading) return;
    setMarkAllLoading(true);
    try {
      await markAllNotificationsReadApi({ token });
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      window.dispatchEvent(
        new CustomEvent('corpserve:notification-unread-sync', { detail: 0 })
      );
      await syncUnreadBadge(token);
    } catch (e) {
      toast.error(e?.message || 'Could not mark all as read');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || !token) return;
    fetchPage(pageIndex + 1, true);
  };

  const renderSection = (title, list) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-4 pt-4">
        <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[2px] px-2">
          {title}
        </h3>
        <div className="space-y-4">
          {list.map((n) => {
            const category = getDisplayCategory(n.relatedEntityType);
            const visual = getNotificationVisual(n);
            const styles = VISUAL_STYLES[visual] ?? VISUAL_STYLES.default;
            const action = getNotificationAction(n, userRole);
            const showOverdue =
              category === 'payment' &&
              !n.isRead &&
              (typeof n.type === 'number'
                ? n.type === 3 || n.type === 4
                : ['Warning', 'Error'].includes(String(n.type)));

            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleMarkRead(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMarkRead(n);
                  }
                }}
                className={`group relative flex gap-5 p-6 rounded-[28px] border transition-all duration-300 transform cursor-pointer hover:scale-[1.01] hover:shadow-xl ${styles.card}`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors ${styles.iconWrap}`}
                >
                  {renderNotificationIcon(styles.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-black text-[17px] tracking-tight text-black">
                      {n.title}
                    </h4>
                    {showOverdue && (
                      <Badge className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-lg border-none uppercase tracking-wider">
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <p className="text-[14.5px] leading-relaxed max-w-4xl text-slate-900 font-semibold transition-colors duration-300">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-5">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (action.path) {
                          navigate(
                            action.path,
                            action.state ? { state: action.state } : undefined
                          );
                        }
                      }}
                      className={`h-10 px-6 rounded-2xl text-[13px] font-extrabold flex gap-2 transition-all active:scale-95 border-2 border-transparent ${action.className}`}
                    >
                      {action.icon}
                      {action.text}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between py-1 min-w-[90px] shrink-0">
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] font-black text-slate-500 bg-white/60 px-2 py-1 rounded-md shadow-sm uppercase tracking-widest">
                      {formatRelativeTime(n.createdAt, nowTick)}
                    </span>

                    {n.isRead ? (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <CheckCheck size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase">
                          Read
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-1 ${newUpdatePillClass(styles.newPill)}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            styles.newPill === 'violet'
                              ? 'bg-violet-600'
                              : styles.newPill === 'amber'
                                ? 'bg-amber-700'
                                : 'bg-indigo-600'
                          }`}
                        />
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                          New update
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole={userRole}>
      <div className="space-y-8 max-w-6xl mx-auto pb-10">
        <Card className="relative overflow-hidden rounded-[32px] border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-blue-100 p-8 shadow-[0_16px_36px_rgba(79,70,229,0.12)]">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="mb-2 text-3xl font-black text-indigo-900 tracking-tight">
                Notifications
              </h1>
              <p className="text-indigo-800/80 font-medium">
                Stay on top of your requests and payments.
              </p>
            </div>
            <Button
              variant="ghost"
              disabled={markAllLoading || items.length === 0}
              onClick={handleMarkAllAsRead}
              className="bg-white/50 hover:bg-white text-indigo-900 font-bold rounded-2xl gap-2 transition-all shadow-sm shrink-0"
            >
              <Check size={18} />{' '}
              {markAllLoading ? 'Updating…' : 'Mark all as read'}
            </Button>
          </div>
        </Card>

        {loading && (
          <p className="text-center text-slate-600 font-medium py-8">
            Loading notifications…
          </p>
        )}

        {!loading && loadError && items.length === 0 && (
          <p className="text-center text-rose-600 font-medium py-8">
            {loadError}
          </p>
        )}

        {!loading && !loadError && items.length === 0 && (
          <p className="text-center text-slate-500 font-medium py-8">
            No notifications yet.
          </p>
        )}

        <div className="space-y-10">
          {renderSection('Today', grouped.today)}
          {renderSection('Yesterday', grouped.yesterday)}
          {renderSection('Older Notifications', grouped.older)}
        </div>

        {hasMore && !loading && (
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={loadMore}
              className="rounded-2xl border-indigo-200 bg-white text-indigo-900 font-bold px-8 py-6"
            >
              {loadingMore ? 'Loading…' : 'See older notifications'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
