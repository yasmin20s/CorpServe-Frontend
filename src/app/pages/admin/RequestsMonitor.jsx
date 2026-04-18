import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Sparkles,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getCategoriesApi } from '../../services/categoriesApi';
import { getAdminRequestsApi } from '../../services/adminMonitorApi';
import UserAvatar from '../../components/UserAvatar';

const menuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Vendor Approvals', path: '/admin/vendor-approvals', icon: <UserCheck className="w-5 h-5" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Categories', path: '/admin/categories', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Requests Monitor', path: '/admin/requests-monitor', icon: <FileText className="w-5 h-5" /> },
  { label: 'SLA Monitor', path: '/admin/sla-monitor', icon: <FileText className="w-5 h-5" /> },
  { label: 'Payments Monitor', path: '/admin/payments-monitor', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

const PAGE_SIZE = 5;

const statusStyles = {
  active: {
    badge: 'border-indigo-400 bg-indigo-200 text-indigo-950 dark:border-indigo-400/35 dark:bg-indigo-500/24 dark:text-indigo-100',
    progress: 'bg-indigo-700',
    accent: 'from-indigo-600/85 via-sky-500/60 to-indigo-500/40',
  },
  pending: {
    badge: 'border-sky-400 bg-sky-200 text-sky-950 dark:border-sky-400/35 dark:bg-sky-500/24 dark:text-sky-100',
    progress: 'bg-sky-700',
    accent: 'from-sky-600/85 via-indigo-500/60 to-sky-500/40',
  },
  completed: {
    badge: 'border-emerald-400 bg-emerald-200 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-500/24 dark:text-emerald-100',
    progress: 'bg-emerald-700',
    accent: 'from-emerald-600/85 via-green-500/60 to-emerald-500/40',
  },
};

/** Keys match backend SLAStatus enum names (case-insensitive → normalized). */
const slaStyles = {
  inprogress: 'border-indigo-400 bg-indigo-200 text-indigo-950 dark:border-indigo-400/30 dark:bg-indigo-500/18 dark:text-indigo-100',
  delayed: 'border-rose-400 bg-rose-200 text-rose-950 dark:border-rose-400/30 dark:bg-rose-500/18 dark:text-rose-100',
  completed: 'border-emerald-400 bg-emerald-200 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-500/18 dark:text-emerald-100',
};

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function mapRequestStatusUi(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'completed') return 'completed';
  return 'pending';
}

function formatMoneyEGP(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `EGP ${Number(n).toLocaleString()}`;
}

function formatDateShort(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

function proposalEta(proposedDeadline) {
  if (!proposedDeadline) return '—';
  const d = new Date(proposedDeadline);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Past due';
  if (days === 0) return 'Today';
  return `${days} day(s)`;
}

function normalizeSlaEnumKey(raw) {
  const s = String(raw || '').replace(/\s+/g, '').toLowerCase();
  if (s === 'inprogress') return 'inprogress';
  if (s === 'delayed') return 'delayed';
  if (s === 'completed') return 'completed';
  return null;
}

function formatSlaStatusLabel(raw) {
  const key = normalizeSlaEnumKey(raw);
  if (key === 'inprogress') return 'In progress';
  if (key === 'delayed') return 'Delayed';
  if (key === 'completed') return 'Completed';
  return String(raw || '').trim() || '—';
}

function formatBudgetRange(budgetMin, budgetMax) {
  const min = Number(budgetMin);
  const max = Number(budgetMax);
  const hasMin = !Number.isNaN(min);
  const hasMax = !Number.isNaN(max);
  if (!hasMin && !hasMax) return '—';
  if (hasMin && hasMax && min === max) return formatMoneyEGP(min);
  if (hasMin && hasMax) return `${formatMoneyEGP(min)} – ${formatMoneyEGP(max)}`;
  if (hasMin) return `${formatMoneyEGP(min)}+`;
  return `Up to ${formatMoneyEGP(max)}`;
}

export default function RequestsMonitor() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    totalRequests: 0,
    activeCount: 0,
    pendingCount: 0,
    delayedSlaCount: 0,
    avgProgress: 0,
    totalBudgetMin: 0,
    totalBudgetMax: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getCategoriesApi();
        const list = Array.isArray(raw) ? raw : [];
        const mapped = list.map((c) => ({
          id: String(pick(c, 'id', 'Id') ?? ''),
          name: String(pick(c, 'name', 'Name') ?? ''),
        })).filter((c) => c.id && c.name);
        if (!cancelled) setCategories(mapped);
      } catch {
        if (!cancelled) {
          toast.error('Failed to load categories');
          setCategories([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadRequests = useCallback(async ({ silent } = {}) => {
    if (!user?.token) return;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const requestStatus =
        statusFilter === 'pending' ? 1
          : statusFilter === 'active' ? 2
            : undefined;
      const slaStatusParsed = slaFilter !== 'all' ? parseInt(slaFilter, 10) : NaN;
      const slaStatus = Number.isFinite(slaStatusParsed) ? slaStatusParsed : undefined;
      const categoryId = categoryFilter !== 'all' ? categoryFilter : undefined;

      const result = await getAdminRequestsApi({
        token: user.token,
        pageIndex: currentPage,
        pageSize: PAGE_SIZE,
        categoryId,
        requestStatus,
        slaStatus,
      });
      setTotalCount(result.count);
      setSummary({
        totalRequests: result.summary?.totalRequests ?? result.count,
        activeCount: result.summary?.activeCount ?? 0,
        pendingCount: result.summary?.pendingCount ?? 0,
        delayedSlaCount: result.summary?.delayedSlaCount ?? 0,
        avgProgress: result.summary?.avgProgress ?? 0,
        totalBudgetMin: result.summary?.totalBudgetMin ?? 0,
        totalBudgetMax: result.summary?.totalBudgetMax ?? 0,
      });
      const rows = result.data.map((r) => {
        const slaRaw = r.slaStatus;
        const slaKey = normalizeSlaEnumKey(slaRaw);
        return {
          id: r.requestId,
          title: r.title,
          description: r.description,
          client: r.clientName,
          clientId: r.clientId,
          clientProfilePictureUrl: r.clientProfilePictureUrl,
          vendor: r.vendorName,
          vendorId: r.vendorId,
          vendorProfilePictureUrl: r.vendorProfilePictureUrl,
          category: r.categoryName,
          status: mapRequestStatusUi(r.requestStatus),
          hasSla: Boolean(slaRaw && String(slaRaw).trim()),
          slaKey,
          slaLabel: formatSlaStatusLabel(slaRaw),
          progress: r.progress,
          budget: formatBudgetRange(r.budgetMin, r.budgetMax),
          deadline: formatDateShort(r.deadline),
          proposals: r.proposals.map((p) => ({
            id: p.proposalId,
            vendorId: p.vendorId,
            vendorName: p.vendorName,
            price: formatMoneyEGP(p.proposedPrice),
            eta: proposalEta(p.proposedDeadline),
            status: String(p.proposalStatus || '').toLowerCase(),
          })),
        };
      });
      setRequests(rows);
    } catch (error) {
      toast.error(error.message || 'Failed to load requests');
      setRequests([]);
      setTotalCount(0);
      setSummary({
        totalRequests: 0,
        activeCount: 0,
        pendingCount: 0,
        delayedSlaCount: 0,
        avgProgress: 0,
        totalBudgetMin: 0,
        totalBudgetMax: 0,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.token, currentPage, categoryFilter, statusFilter, slaFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, slaFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const metrics = {
    activeRequests: summary.activeCount,
    pendingRequests: summary.pendingCount,
    delayedSla: summary.delayedSlaCount,
    avgProgress: summary.avgProgress,
    totalBudgetMin: summary.totalBudgetMin,
    totalBudgetMax: summary.totalBudgetMax,
    allTracked: summary.totalRequests,
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-4 lg:space-y-8">
        <div className="cs-glow-sweep group relative overflow-hidden rounded-[1rem] border border-indigo-400/80 bg-gradient-to-br from-indigo-200 via-blue-100 to-violet-200 p-3.5 shadow-[0_20px_48px_rgba(79,70,229,0.2)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_32px_64px_rgba(79,70,229,0.28)] sm:rounded-[1.75rem] sm:p-7 lg:rounded-[2rem] lg:p-9 dark:border-indigo-400/25 dark:bg-gradient-to-br dark:from-[#1a2745] dark:via-[#233861] dark:to-[#2b4a75] dark:shadow-[0_18px_40px_rgba(2,6,23,0.5)] dark:hover:shadow-[0_20px_44px_rgba(2,6,23,0.56)]">
          <div className="cs-glow-orb absolute -left-10 top-4 h-44 w-44 rounded-full bg-indigo-600/35 blur-3xl dark:bg-indigo-500/24" />
          <div className="cs-glow-orb-delayed absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-sky-600/30 blur-3xl dark:bg-sky-500/22" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-700 sm:mb-4 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.18em] dark:border-indigo-400/30 dark:bg-slate-900/78 dark:text-indigo-200">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Wide Monitor View
              </div>
              <h1 className="text-[1.7rem] font-bold leading-tight text-slate-950 sm:text-4xl lg:text-[2.75rem] dark:text-slate-100">Requests Monitor</h1>
              <p className="mt-1.5 text-[13px] text-slate-700 sm:mt-3 sm:text-base lg:text-lg dark:text-slate-300">Larger layout, cleaner hierarchy, and wider cards so every request detail is readable at a glance.</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:max-w-lg">
              <div className="grid w-full gap-2.5 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-lg border border-indigo-200 bg-white/90 p-3 shadow-sm sm:rounded-2xl sm:p-5 dark:border-indigo-400/35 dark:bg-slate-900/70 dark:shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-200">Total Budget</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-3xl dark:text-slate-100">{formatBudgetRange(metrics.totalBudgetMin, metrics.totalBudgetMax)}</p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-300/80">Whole platform data</p>
                </div>
                <div className="rounded-lg border border-indigo-400 bg-indigo-200/85 p-3 shadow-sm sm:rounded-2xl sm:p-5 dark:border-indigo-400/30 dark:bg-indigo-500/18 dark:shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-200">Avg Progress</p>
                  <p className="mt-1 text-lg font-bold text-indigo-950 sm:mt-2 sm:text-3xl dark:text-indigo-100">{metrics.avgProgress}%</p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-300/80">Whole platform data</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/35 dark:bg-slate-900/80 dark:text-indigo-200 dark:hover:bg-indigo-500/16"
                onClick={() => loadRequests({ silent: true })}
                disabled={isRefreshing || !user?.token}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-indigo-400 bg-gradient-to-br from-indigo-200/85 to-white shadow-sm dark:border-indigo-400/30 dark:bg-gradient-to-br dark:from-indigo-500/24 dark:to-slate-800 dark:shadow-none">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-indigo-900 sm:text-sm dark:text-indigo-100">Active Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl dark:text-slate-100">{metrics.activeRequests}</p>
              <p className="mt-1 text-[10px] text-indigo-800/80 dark:text-indigo-200/80">Whole platform data</p>
            </CardContent>
          </Card>
          <Card className="border-sky-400 bg-gradient-to-br from-sky-200/85 to-white shadow-sm dark:border-sky-400/30 dark:bg-gradient-to-br dark:from-sky-500/24 dark:to-slate-800 dark:shadow-none">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-sky-900 sm:text-sm dark:text-sky-100">Pending Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl dark:text-slate-100">{metrics.pendingRequests}</p>
              <p className="mt-1 text-[10px] text-sky-800/80 dark:text-sky-200/80">Whole platform data</p>
            </CardContent>
          </Card>
          <Card className="border-rose-400 bg-gradient-to-br from-rose-200/85 to-white shadow-sm dark:border-rose-400/30 dark:bg-gradient-to-br dark:from-rose-500/24 dark:to-slate-800 dark:shadow-none">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-rose-900 sm:text-sm dark:text-rose-100">SLA Delayed</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl dark:text-slate-100">{metrics.delayedSla}</p>
              <p className="mt-1 text-[10px] text-rose-800/80 dark:text-rose-200/80">Whole platform data</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-400 bg-gradient-to-br from-emerald-200/85 to-white shadow-sm dark:border-emerald-400/30 dark:bg-gradient-to-br dark:from-emerald-500/24 dark:to-slate-800 dark:shadow-none">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-emerald-900 sm:text-sm dark:text-emerald-100">All Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl dark:text-slate-100">{metrics.allTracked}</p>
              <p className="mt-1 text-[10px] text-emerald-800/80 dark:text-emerald-200/80">Whole platform data</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-indigo-200 bg-white/90 shadow-sm dark:border-indigo-400/25 dark:bg-slate-800/78 dark:shadow-none">
          <CardContent className="p-3.5 sm:p-6 lg:p-7">
            <div className="mb-4 flex items-center justify-between sm:mb-5">
              <h2 className="text-base font-semibold text-slate-900 sm:text-xl dark:text-slate-100">Filters</h2>
              <span className="rounded-full border border-indigo-400 bg-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-950 dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-100">Live</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 text-xs sm:h-12 sm:text-base"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs sm:h-12 sm:text-base"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger className="h-10 text-xs sm:h-12 sm:text-base"><SelectValue placeholder="SLA status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA statuses</SelectItem>
                  <SelectItem value="1">In progress</SelectItem>
                  <SelectItem value="2">Delayed</SelectItem>
                  <SelectItem value="3">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Loading requests…</p>
        ) : null}

        <div className="space-y-2.5 sm:space-y-5">
          {requests.map((request, index) => {
            const statusConfig = statusStyles[request.status] || statusStyles.pending;
            const slaClass = request.slaKey ? slaStyles[request.slaKey] : null;

            return (
              <Card
                key={request.id}
                className="cs-card-rise group relative overflow-hidden border-indigo-300 bg-white shadow-[0_10px_24px_rgba(79,70,229,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-[0_14px_30px_rgba(79,70,229,0.2)] dark:border-slate-700 dark:bg-slate-900/88 dark:shadow-none dark:hover:border-indigo-400/35 dark:hover:shadow-none"
                style={{ animationDelay: `${160 + index * 110}ms` }}
              >
                <div className={`cs-glow-orb pointer-events-none absolute -left-12 top-0 h-full w-52 bg-gradient-to-br ${statusConfig.accent} blur-2xl`} />
                <CardContent className="relative p-3 sm:p-6 lg:p-7">
                  <div className="mb-3 flex flex-col gap-2.5 sm:mb-5 sm:gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900 sm:text-2xl lg:text-[1.7rem] dark:text-slate-100">{request.title}</h3>
                      <p className="mt-1 max-w-3xl text-xs text-slate-600 sm:text-base dark:text-slate-300">{request.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 sm:text-base dark:text-slate-400">
                        <span className="font-medium text-slate-500 dark:text-slate-200">Client:</span>
                        <UserAvatar
                          userId={request.clientId}
                          name={request.client}
                          profilePictureUrl={request.clientProfilePictureUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2.5">
                      <Badge variant="outline" className="border-indigo-400 bg-indigo-200 px-2 py-0.5 text-[11px] text-indigo-950 sm:px-3 sm:py-1 sm:text-sm dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-100">{request.category || '—'}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${statusConfig.badge}`}>{request.status}</Badge>
                      {request.hasSla ? (
                        <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${slaClass || 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}>
                          SLA: {request.slaLabel}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 sm:rounded-2xl sm:p-4 dark:border-emerald-400/25 dark:bg-emerald-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-200">Vendor</p>
                      <div className="mt-1 sm:mt-2">
                        <UserAvatar
                          userId={request.vendorId}
                          name={request.vendor || 'Unassigned vendor'}
                          profilePictureUrl={request.vendorProfilePictureUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:rounded-2xl sm:p-4 dark:border-indigo-400/25 dark:bg-indigo-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Client budget</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg dark:text-slate-100">{request.budget}</p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 sm:rounded-2xl sm:p-4 dark:border-sky-400/25 dark:bg-sky-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-200">Deadline</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg dark:text-slate-100">{request.deadline}</p>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:rounded-2xl sm:p-4 dark:border-indigo-400/25 dark:bg-indigo-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Status Snapshot</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 sm:mt-2 sm:gap-2 sm:text-base dark:text-slate-100">
                        {request.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-emerald-700 sm:h-5 sm:w-5" /> : <Clock3 className="h-4 w-4 text-sky-700 sm:h-5 sm:w-5" />}
                        {request.status === 'active' ? 'In Progress' : request.status === 'completed' ? 'Completed' : 'Waiting Assignment'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 p-2.5 sm:mt-5 sm:rounded-2xl sm:p-4 dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-indigo-500/12 dark:to-sky-500/12">
                    <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Execution Progress</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:px-3 sm:py-1 sm:text-sm dark:border-indigo-400/30 dark:bg-slate-900/80 dark:text-indigo-100">
                        {request.progress}%
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <Progress value={request.progress} className="h-3 bg-indigo-100 sm:h-3.5" indicatorClassName={statusConfig.progress} />
                    {request.slaKey === 'delayed' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 sm:mt-3 sm:gap-2 sm:text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Attention: SLA is in delayed status.
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5 sm:mt-5 sm:rounded-2xl sm:p-4 dark:border-indigo-400/25 dark:bg-indigo-500/14">
                    <div className="mb-2 flex items-center justify-between sm:mb-3">
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-100">Proposals</h4>
                      <Badge variant="outline" className="border-indigo-400 bg-indigo-200 text-xs text-indigo-950 sm:text-sm dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-100">
                        {request.proposals.length} proposal(s)
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {request.proposals.map((proposal) => (
                        <div key={proposal.id} className="rounded-md border border-indigo-200 bg-white p-2 sm:rounded-xl sm:p-3 dark:border-indigo-400/25 dark:bg-slate-800/74">
                          <UserAvatar
                            userId={proposal.vendorId}
                            name={proposal.vendorName}
                            profilePictureUrl={undefined}
                            size="xs"
                          />
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-300">Proposed price: {proposal.price}</p>
                          <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-300">ETA: {proposal.eta}</p>
                          <Badge variant="outline" className="mt-1.5 border-indigo-200 bg-indigo-50 text-[11px] text-indigo-700 sm:mt-2 sm:text-xs dark:border-indigo-400/30 dark:bg-indigo-500/16 dark:text-indigo-100">{proposal.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && requests.length === 0 && (
            <Card className="border-indigo-200 bg-white dark:border-indigo-400/25 dark:bg-slate-800/78">
              <CardContent className="p-10 text-center text-slate-500">
                <p className="dark:text-slate-300">No requests match the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && totalCount > 0 ? (
          <Card className="border-indigo-200 bg-white/90 shadow-sm dark:border-indigo-400/25 dark:bg-slate-800/78 dark:shadow-none">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-200">
                Page {currentPage} of {totalPages} · {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-400/35 dark:bg-slate-800/70 dark:text-indigo-200 dark:hover:bg-indigo-500/18"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isRefreshing}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-400/35 dark:bg-slate-800/70 dark:text-indigo-200 dark:hover:bg-indigo-500/18"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isRefreshing}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
