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

const PAGE_SIZE = 10;

const statusStyles = {
  active: {
    badge: 'border-violet-400 bg-violet-200 text-violet-950',
    progress: 'bg-violet-800',
    accent: 'from-violet-600/60 via-fuchsia-500/35 to-indigo-500/25',
  },
  pending: {
    badge: 'border-indigo-400 bg-indigo-200 text-indigo-950',
    progress: 'bg-indigo-800',
    accent: 'from-indigo-600/60 via-blue-500/35 to-violet-500/25',
  },
  completed: {
    badge: 'border-purple-400 bg-purple-200 text-purple-950',
    progress: 'bg-purple-800',
    accent: 'from-purple-600/60 via-violet-500/35 to-fuchsia-500/25',
  },
};

/** Keys match backend SLAStatus enum names (case-insensitive → normalized). */
const slaStyles = {
  inprogress: 'border-violet-400 bg-violet-200 text-violet-950',
  delayed: 'border-rose-400 bg-rose-200 text-rose-950',
  completed: 'border-purple-400 bg-purple-200 text-purple-950',
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
          vendor: r.vendorName,
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
        <div className="cs-glow-sweep relative overflow-hidden rounded-[1rem] border border-violet-300 bg-gradient-to-r from-[#e7d3ff] via-[#dcc1ff] to-[#d2b0ff] p-3.5 shadow-[0_24px_65px_rgba(76,29,149,0.28)] sm:rounded-[1.75rem] sm:p-7 lg:rounded-[2rem] lg:p-9">
          <div className="cs-glow-orb absolute -left-10 top-4 h-44 w-44 rounded-full bg-violet-600/35 blur-3xl" />
          <div className="cs-glow-orb-delayed absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-fuchsia-600/30 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-400 bg-violet-200/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-950 sm:mb-4 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.18em]">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
                Wide Monitor View
              </div>
              <h1 className="text-[1.7rem] font-bold leading-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">Requests Monitor</h1>
              <p className="mt-1.5 text-[13px] text-slate-700 sm:mt-3 sm:text-base lg:text-lg">Larger layout, cleaner hierarchy, and wider cards so every request detail is readable at a glance.</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:max-w-lg">
              <div className="grid w-full gap-2.5 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-lg border border-violet-300 bg-violet-50/90 p-3 shadow-sm sm:rounded-2xl sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Total Budget</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-3xl">{formatBudgetRange(metrics.totalBudgetMin, metrics.totalBudgetMax)}</p>
                  <p className="mt-1 text-[10px] text-slate-500">Whole platform data</p>
                </div>
                <div className="rounded-lg border border-violet-300 bg-violet-50/90 p-3 shadow-sm sm:rounded-2xl sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Avg Progress</p>
                  <p className="mt-1 text-lg font-bold text-violet-950 sm:mt-2 sm:text-3xl">{metrics.avgProgress}%</p>
                  <p className="mt-1 text-[10px] text-slate-500">Whole platform data</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0 border-violet-400 bg-white text-violet-900 hover:bg-violet-50"
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
          <Card className="border-violet-400 bg-gradient-to-br from-violet-200 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-violet-900 sm:text-sm">Active Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{metrics.activeRequests}</p>
              <p className="mt-1 text-[10px] text-violet-800/80">Whole platform data</p>
            </CardContent>
          </Card>
          <Card className="border-indigo-400 bg-gradient-to-br from-indigo-200 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-indigo-900 sm:text-sm">Pending Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{metrics.pendingRequests}</p>
              <p className="mt-1 text-[10px] text-indigo-800/80">Whole platform data</p>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-400 bg-gradient-to-br from-fuchsia-200 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-fuchsia-900 sm:text-sm">SLA Delayed</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{metrics.delayedSla}</p>
              <p className="mt-1 text-[10px] text-fuchsia-800/80">Whole platform data</p>
            </CardContent>
          </Card>
          <Card className="border-slate-500 bg-gradient-to-br from-slate-300 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-slate-800 sm:text-sm">All Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{metrics.allTracked}</p>
              <p className="mt-1 text-[10px] text-slate-600">Whole platform data</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-400 bg-slate-100 shadow-sm">
          <CardContent className="p-3.5 sm:p-6 lg:p-7">
            <div className="mb-4 flex items-center justify-between sm:mb-5">
              <h2 className="text-base font-semibold text-slate-900 sm:text-xl">Filters</h2>
              <span className="rounded-full border border-violet-400 bg-violet-200 px-3 py-1 text-xs font-semibold text-violet-950">Live</span>
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
          <p className="text-sm font-medium text-violet-800">Loading requests…</p>
        ) : null}

        <div className="space-y-2.5 sm:space-y-5">
          {requests.map((request, index) => {
            const statusConfig = statusStyles[request.status] || statusStyles.pending;
            const slaClass = request.slaKey ? slaStyles[request.slaKey] : null;

            return (
              <Card
                key={request.id}
                className="cs-card-rise group relative overflow-hidden border-slate-400 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_20px_45px_rgba(76,29,149,0.24)]"
                style={{ animationDelay: `${160 + index * 110}ms` }}
              >
                <div className={`cs-glow-orb pointer-events-none absolute -left-12 top-0 h-full w-52 bg-gradient-to-br ${statusConfig.accent} blur-2xl`} />
                <CardContent className="relative p-3 sm:p-6 lg:p-7">
                  <div className="mb-3 flex flex-col gap-2.5 sm:mb-5 sm:gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900 sm:text-2xl lg:text-[1.7rem]">{request.title}</h3>
                      <p className="mt-1 max-w-3xl text-xs text-slate-600 sm:text-base">{request.description}</p>
                      <p className="mt-1 text-xs text-slate-600 sm:text-base">Client: {request.client}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2.5">
                      <Badge variant="outline" className="border-violet-400 bg-violet-200 px-2 py-0.5 text-[11px] text-violet-950 sm:px-3 sm:py-1 sm:text-sm">{request.category || '—'}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${statusConfig.badge}`}>{request.status}</Badge>
                      {request.hasSla ? (
                        <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${slaClass || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          SLA: {request.slaLabel}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg">{request.vendor || 'Unassigned vendor'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Client budget</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg">{request.budget}</p>
                    </div>
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deadline</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg">{request.deadline}</p>
                    </div>
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Status Snapshot</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 sm:mt-2 sm:gap-2 sm:text-base">
                        {request.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" /> : <Clock3 className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />}
                        {request.status === 'active' ? 'In Progress' : request.status === 'completed' ? 'Completed' : 'Waiting Assignment'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-lg border border-slate-400 bg-white p-2.5 sm:mt-5 sm:rounded-2xl sm:p-4">
                    <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Execution Progress</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-900 sm:px-3 sm:py-1 sm:text-sm">
                        {request.progress}%
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <Progress value={request.progress} className="h-3 bg-slate-100 sm:h-3.5" indicatorClassName={statusConfig.progress} />
                    {request.slaKey === 'delayed' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 sm:mt-3 sm:gap-2 sm:text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Attention: SLA is in delayed status.
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 rounded-lg border border-slate-400 bg-slate-200/80 p-2.5 sm:mt-5 sm:rounded-2xl sm:p-4">
                    <div className="mb-2 flex items-center justify-between sm:mb-3">
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-700">Proposals</h4>
                      <Badge variant="outline" className="border-violet-400 bg-violet-200 text-xs text-violet-950 sm:text-sm">
                        {request.proposals.length} proposal(s)
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {request.proposals.map((proposal) => (
                        <div key={proposal.id} className="rounded-md border border-slate-400 bg-white p-2 sm:rounded-xl sm:p-3">
                          <p className="text-xs font-semibold text-slate-900 sm:text-sm">{proposal.vendorName}</p>
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm">Proposed price: {proposal.price}</p>
                          <p className="text-xs text-slate-600 sm:text-sm">ETA: {proposal.eta}</p>
                          <Badge variant="outline" className="mt-1.5 border-slate-400 bg-slate-200 text-[11px] text-slate-900 sm:mt-2 sm:text-xs">{proposal.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && requests.length === 0 && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-10 text-center text-slate-500">
                No requests match the selected filters.
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && totalCount > 0 ? (
          <Card className="border-violet-200 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-800">
                Page {currentPage} of {totalPages} · {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-violet-200 text-violet-800 hover:bg-violet-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isRefreshing}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-violet-200 text-violet-800 hover:bg-violet-50"
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
