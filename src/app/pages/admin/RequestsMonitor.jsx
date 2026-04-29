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
    badge: 'border-blue-400 bg-blue-200 text-blue-950 dark:border-blue-400/35 dark:bg-blue-500/24 dark:text-blue-100',
    progress: 'bg-blue-700',
    accent: 'from-blue-600/85 via-cyan-500/60 to-blue-500/40',
  },
  pending: {
    badge: 'border-amber-400 bg-amber-200 text-amber-950 dark:border-amber-400/35 dark:bg-amber-500/24 dark:text-amber-100',
    progress: 'bg-amber-700',
    accent: 'from-amber-600/85 via-orange-500/60 to-amber-500/40',
  },
  completed: {
    badge: 'border-emerald-400 bg-emerald-200 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-500/24 dark:text-emerald-100',
    progress: 'bg-emerald-700',
    accent: 'from-emerald-600/85 via-teal-500/60 to-emerald-500/40',
  },
};

/** Keys match backend SLAStatus enum names (case-insensitive → normalized). */
const slaStyles = {
  inprogress: 'border-blue-400 bg-blue-200 text-blue-950 dark:border-blue-400/30 dark:bg-blue-500/18 dark:text-blue-100',
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

  function requestRowTone(status, slaKey) {
    const normalizedStatus = String(status || '').toLowerCase();
  
    // Based on SLA status - takes priority for visual feedback
    if (slaKey === 'completed') {
      return {
        wrapper: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/60 dark:border-emerald-400/25 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:via-slate-900 dark:to-cyan-500/10',
        stripe: 'from-emerald-500 to-cyan-500',
      };
    }
  
    if (slaKey === 'delayed') {
      return {
        wrapper: 'border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-pink-50/60 dark:border-rose-400/25 dark:bg-gradient-to-r dark:from-rose-500/10 dark:via-slate-900 dark:to-pink-500/10',
        stripe: 'from-rose-500 to-pink-500',
      };
    }
  
    if (slaKey === 'inprogress' || normalizedStatus === 'active') {
      return {
        wrapper: 'border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/60 dark:border-amber-400/25 dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-slate-900 dark:to-orange-500/10',
        stripe: 'from-amber-500 to-orange-500',
      };
    }
  
    // Default (pending or other)
    return {
      wrapper: 'border-indigo-100 bg-gradient-to-r from-white via-indigo-50/20 to-violet-50/25 dark:border-indigo-400/20 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-500/10',
      stripe: 'from-indigo-500 to-violet-500',
    };
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
      <div className="space-y-3 lg:space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-violet-100 bg-[#f3edff] px-6 py-7 dark:border-violet-500/20 dark:bg-slate-900/60">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 to-blue-500" />
          <div className="absolute right-6 top-6 h-2.5 w-2.5 rounded-full bg-violet-400" />
          
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between px-2">
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#6d28d9] shadow-sm dark:bg-violet-900/40 dark:text-violet-200">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                DASHBOARD
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Requests Monitor
              </h1>
              <p className="mt-2 max-w-xl text-[14px] text-violet-700/80 dark:text-violet-300">
                Track request flow, SLA status, and proposal updates from one cinematic dashboard.
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex min-w-[140px] flex-col rounded-lg border border-violet-200/60 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md dark:border-violet-400/20 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">Total Budget</span>
                  <span className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">{formatBudgetRange(metrics.totalBudgetMin, metrics.totalBudgetMax)}</span>
                </div>
                <div className="flex min-w-[140px] flex-col rounded-lg border border-indigo-200/60 bg-indigo-50/50 px-4 py-2 shadow-sm backdrop-blur-md dark:border-indigo-400/20 dark:bg-indigo-900/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Avg Progress</span>
                  <span className="mt-0.5 text-lg font-extrabold text-indigo-700 dark:text-indigo-200">{metrics.avgProgress}%</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="mt-2 h-10 shrink-0 rounded-lg bg-[#7c3aed] px-5 font-semibold text-white shadow-sm transition-colors hover:bg-[#6d28d9] dark:bg-violet-600 dark:hover:bg-violet-500 md:mt-0"
              onClick={() => loadRequests({ silent: true })}
              disabled={isRefreshing || !user?.token}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-100">Active Requests</p>
                <Sparkles className="h-4 w-4 text-indigo-100" />
              </div>
              <p className="text-xl font-bold tabular-nums">{metrics.activeRequests}</p>
              <p className="mt-1.5 text-[11px] text-indigo-100">Based on all active items</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-[0_14px_34px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100">Pending Requests</p>
                <Clock3 className="h-4 w-4 text-blue-100" />
              </div>
              <p className="text-xl font-bold tabular-nums">{metrics.pendingRequests}</p>
              <p className="mt-1.5 text-[11px] text-blue-100">Requests waiting for action</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-[0_14px_34px_rgba(16,185,129,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100">SLA Delayed</p>
                <AlertTriangle className="h-4 w-4 text-emerald-100" />
              </div>
              <p className="text-xl font-bold tabular-nums">{metrics.delayedSla}</p>
              <p className="mt-1.5 text-[11px] text-emerald-100">Needs close attention</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_14px_34px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100">All Requests</p>
                <FileText className="h-4 w-4 text-amber-100" />
              </div>
              <p className="text-xl font-bold tabular-nums">{metrics.allTracked}</p>
              <p className="mt-1.5 text-[11px] text-amber-100">Whole platform data</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-indigo-100 bg-gradient-to-r from-white via-indigo-50/35 to-sky-50/40 shadow-sm dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-500/10">
          <CardContent className="p-3.5 sm:p-5 lg:p-6">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">Filters</h2>
              <span className="rounded-full border border-violet-400 bg-violet-200 px-2.5 py-1 text-[11px] font-semibold text-violet-950 dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-100">Live</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="SLA status" /></SelectTrigger>
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
           const rowTone = requestRowTone(request.status, request.slaKey);

            return (
              <Card
                key={request.id}
                 className={`cs-card-rise group relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-lg sm:p-4 ${rowTone.wrapper}`}
                style={{ animationDelay: `${160 + index * 110}ms` }}
              >
                 <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${rowTone.stripe}`} />
                <CardContent className="relative p-2.5 sm:p-4 lg:p-5">
                  <div className="mb-3 flex flex-col gap-2 sm:mb-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 sm:text-xl dark:text-slate-100">{request.title}</h3>
                      <p className="mt-1 max-w-3xl text-[13px] text-slate-600 sm:text-sm dark:text-slate-300">{request.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:text-sm dark:text-slate-400">
                        <span className="font-medium text-slate-500 dark:text-slate-200">Client:</span>
                        <UserAvatar
                          userId={request.clientId}
                          name={request.client}
                          profilePictureUrl={request.clientProfilePictureUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="border-violet-400 bg-violet-200 px-2 py-0.5 text-[10px] text-violet-950 sm:text-xs dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-100">{request.category || '—'}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[10px] sm:text-xs ${statusConfig.badge}`}>{request.status}</Badge>
                      {request.hasSla ? (
                        <Badge className={`border px-2 py-0.5 text-[10px] sm:text-xs ${slaClass || 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}>
                          SLA: {request.slaLabel}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-400/25 dark:bg-emerald-500/14">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-200">Vendor</p>
                      <div className="mt-1">
                        <UserAvatar
                          userId={request.vendorId}
                          name={request.vendor || 'Unassigned vendor'}
                          profilePictureUrl={request.vendorProfilePictureUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-2.5 dark:border-cyan-400/25 dark:bg-cyan-500/14">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-200">Client budget</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{request.budget}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 dark:border-blue-400/25 dark:bg-blue-500/14">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-200">Deadline</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{request.deadline}</p>
                    </div>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5 dark:border-violet-400/25 dark:bg-violet-500/14">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-200">Status Snapshot</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {request.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <Clock3 className="h-4 w-4 text-blue-700" />}
                        {request.status === 'active' ? 'In Progress' : request.status === 'completed' ? 'Completed' : 'Waiting Assignment'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 p-2.5 dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-indigo-500/12 dark:to-sky-500/12">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Execution Progress</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-400/30 dark:bg-slate-900/80 dark:text-indigo-100">
                        {request.progress}%
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                    <Progress value={request.progress} className="h-2.5 bg-indigo-100" indicatorClassName={statusConfig.progress} />
                    {request.slaKey === 'delayed' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Attention: SLA is in delayed status.
                      </p>
                    )}
                  </div>

                  <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50/70 p-2.5 dark:border-violet-400/25 dark:bg-violet-500/14">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-100">Proposals</h4>
                      <Badge variant="outline" className="border-violet-400 bg-violet-200 text-[10px] text-violet-950 dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-100">
                        {request.proposals.length} proposal(s)
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {request.proposals.map((proposal) => (
                        <div key={proposal.id} className="rounded-md border border-indigo-200 bg-white p-2 dark:border-indigo-400/25 dark:bg-slate-800/74">
                          <UserAvatar
                            userId={proposal.vendorId}
                            name={proposal.vendorName}
                            profilePictureUrl={undefined}
                            size="xs"
                          />
                          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Proposed price: {proposal.price}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">ETA: {proposal.eta}</p>
                          <Badge variant="outline" className="mt-1.5 border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/16 dark:text-indigo-100">{proposal.status}</Badge>
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
          <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20 shadow-sm dark:border-indigo-400/25 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-900/95">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700 dark:text-violet-200">
                Page {currentPage} of {totalPages} · {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-violet-200 text-violet-800 hover:bg-violet-50 dark:border-violet-400/35 dark:bg-slate-800/70 dark:text-violet-200 dark:hover:bg-violet-500/18"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isRefreshing}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-violet-200 text-violet-800 hover:bg-violet-50 dark:border-violet-400/35 dark:bg-slate-800/70 dark:text-violet-200 dark:hover:bg-violet-500/18"
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
