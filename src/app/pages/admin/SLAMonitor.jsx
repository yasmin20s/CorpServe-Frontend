import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Eye,
  AlertTriangle,
  Activity,
  Sparkles,
  ArrowUpRight,
  Clock3,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getCategoriesApi } from '../../services/categoriesApi';
import { getAdminSlasApi } from '../../services/adminMonitorApi';
import UserAvatar from '../../components/UserAvatar';
import { formatDeadlineDate } from '../../lib/formatDeadlineDate';

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
  'in-progress': {
    badge: 'border-indigo-400 bg-indigo-200 text-indigo-950 dark:border-indigo-400/35 dark:bg-indigo-500/24 dark:text-indigo-100',
    accent: 'from-indigo-600/85 via-sky-500/60 to-indigo-500/40',
  },
  breached: {
    badge: 'border-rose-400 bg-rose-200 text-rose-950 dark:border-rose-400/35 dark:bg-rose-500/24 dark:text-rose-100',
    accent: 'from-rose-600/85 via-red-500/60 to-rose-500/40',
  },
  delayed: {
    badge: 'border-sky-400 bg-sky-200 text-sky-950 dark:border-sky-400/35 dark:bg-sky-500/24 dark:text-sky-100',
    accent: 'from-sky-600/85 via-indigo-500/60 to-sky-500/40',
  },
  completed: {
    badge: 'border-emerald-400 bg-emerald-200 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-500/24 dark:text-emerald-100',
    accent: 'from-emerald-600/85 via-green-500/60 to-emerald-500/40',
  },
};

const slaStatusStyles = {
  active: 'border-indigo-400 bg-indigo-200 text-indigo-950 dark:border-indigo-400/30 dark:bg-indigo-500/18 dark:text-indigo-100',
  breached: 'border-rose-400 bg-rose-200 text-rose-950 dark:border-rose-400/30 dark:bg-rose-500/18 dark:text-rose-100',
  delayed: 'border-sky-400 bg-sky-200 text-sky-950 dark:border-sky-400/30 dark:bg-sky-500/18 dark:text-sky-100',
  completed: 'border-emerald-400 bg-emerald-200 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-500/18 dark:text-emerald-100',
};

const warningLevelStyles = {
  none: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-200',
  low: 'border-indigo-400 bg-indigo-200 text-indigo-950 dark:border-indigo-400/30 dark:bg-indigo-500/18 dark:text-indigo-100',
  medium: 'border-sky-400 bg-sky-200 text-sky-950 dark:border-sky-400/30 dark:bg-sky-500/18 dark:text-sky-100',
  high: 'border-rose-400 bg-rose-200 text-rose-950 dark:border-rose-400/30 dark:bg-rose-500/18 dark:text-rose-100',
};

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function formatMoneyEGP(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `EGP ${Number(n).toLocaleString()}`;
}

/** Matches CorpServe.Domain.Entities.ProposalModule.SLAStatus int values */
function contractSlugToInt(slug) {
  if (slug === 'in-progress') return 1;
  if (slug === 'delayed') return 2;
  if (slug === 'completed') return 3;
  if (slug === 'breached') return 4;
  return undefined;
}

/** Maps SLA Monitor UI filter slugs to SLAStatus int (same as contractSlugToInt for status rows) */
function slaUiToInt(slug) {
  if (slug === 'active') return 1;
  if (slug === 'delayed') return 2;
  if (slug === 'completed') return 3;
  if (slug === 'breached') return 4;
  return undefined;
}

export default function SLAMonitor() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [hero, setHero] = useState({
    totalSlaContracts: 0,
    inProgressCount: 0,
    breachedCount: 0,
    delayedCount: 0,
    completedCount: 0,
  });
  const [contracts, setContracts] = useState([]);
  const [contractsTotal, setContractsTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [contractStatusFilter, setContractStatusFilter] = useState('all');
  const [slaStatusFilter, setSlaStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const slasFetchIdRef = useRef(0);

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

  const loadSlas = useCallback(async ({ silent } = {}) => {
    if (!user?.token) return;
    const fetchId = ++slasFetchIdRef.current;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    const categoryId = categoryFilter !== 'all' ? categoryFilter : undefined;
    const contractInt = contractStatusFilter !== 'all' ? contractSlugToInt(contractStatusFilter) : undefined;
    const slaInt = slaStatusFilter !== 'all' ? slaUiToInt(slaStatusFilter) : undefined;

    try {
      const result = await getAdminSlasApi({
        token: user.token,
        pageIndex: currentPage,
        pageSize: PAGE_SIZE,
        categoryId,
        contractStatus: contractInt != null ? contractInt : undefined,
        slaStatus:
          contractInt == null && slaInt != null ? slaInt : undefined,
      });

      if (fetchId !== slasFetchIdRef.current) return;

      setHero({
        totalSlaContracts: result.totalSlaContracts,
        inProgressCount: result.inProgressCount,
        breachedCount: result.breachedCount,
        delayedCount: result.delayedCount,
        completedCount: result.completedCount,
      });

      setContractsTotal(result.contracts.count);
      const rows = result.contracts.data.map((c) => ({
        id: c.slaContractId,
        request: c.requestTitle,
        description: c.description,
        client: c.clientName,
        clientId: c.clientId,
        clientProfilePictureUrl: c.clientProfilePictureUrl,
        vendor: c.vendorName,
        vendorId: c.vendorId,
        vendorProfilePictureUrl: c.vendorProfilePictureUrl,
        category: c.categoryName,
        price: formatMoneyEGP(c.price),
        createdAt: formatDeadlineDate(c.createdAt),
        deadline: formatDeadlineDate(c.deadline),
        contractStatus: c.contractStatus || 'in-progress',
        slaStatus: c.slaUiStatus || 'active',
        warningLevel: c.warningLevelUi || 'none',
        progress: c.requestProgress,
        daysRemaining: c.daysRemaining,
      }));
      setContracts(rows);
    } catch (error) {
      if (fetchId !== slasFetchIdRef.current) return;
      toast.error(error.message || 'Failed to load SLA monitor');
      setContracts([]);
      setContractsTotal(0);
    } finally {
      if (fetchId === slasFetchIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user?.token, currentPage, categoryFilter, contractStatusFilter, slaStatusFilter]);

  useEffect(() => {
    loadSlas();
  }, [loadSlas]);

  const totalPages = Math.max(1, Math.ceil(contractsTotal / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filteredSlas = useMemo(() => contracts, [contracts]);

  return (
    <DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <Card className="group relative overflow-hidden border-indigo-300/80 bg-gradient-to-br from-indigo-100 via-blue-50 to-violet-100 shadow-[0_18px_45px_rgba(79,70,229,0.16)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_rgba(79,70,229,0.25)] dark:border-indigo-400/25 dark:bg-gradient-to-br dark:from-[#1a2745] dark:via-[#233861] dark:to-[#2b4a75] dark:shadow-[0_18px_40px_rgba(2,6,23,0.5)] dark:hover:shadow-[0_20px_44px_rgba(2,6,23,0.56)]">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,70,229,0.1)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-violet-500" />
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-indigo-300/35 blur-3xl dark:bg-indigo-500/16" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-500/14" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-400/30 dark:bg-slate-800/70 dark:text-indigo-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Admin Control Room
                </p>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                  SLA <span className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent">Monitor</span>
                </h1>
                <p className="mt-1 text-sm text-indigo-900/80 sm:text-base dark:text-indigo-200/85">Creative, high-contrast oversight for all platform agreements.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                    <UserCheck className="h-3.5 w-3.5" />
                    {hero.inProgressCount} Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {hero.breachedCount} Breached
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/85 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition-all duration-300 group-hover:translate-x-0.5 dark:border-indigo-400/30 dark:bg-slate-800/70 dark:text-indigo-200 dark:shadow-none">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Live Database</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center h-10 rounded-2xl border border-indigo-200 bg-white/85 px-4 font-semibold text-indigo-700 shadow-sm hover:bg-white dark:border-indigo-400/30 dark:bg-slate-800/70 dark:text-indigo-200"
                  onClick={() => loadSlas({ silent: true })}
                  disabled={isRefreshing || !user?.token}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="group relative overflow-hidden border-indigo-200 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-400/25 dark:bg-slate-800/78 dark:shadow-none dark:hover:shadow-none">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-200">Total</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{hero.totalSlaContracts}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-indigo-500">Platform overview</p>
                </div>
                <span className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-indigo-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 dark:border-indigo-400/35 dark:bg-slate-800/70 dark:text-indigo-200">
                  <LayoutDashboard className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden border-emerald-200 bg-emerald-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-400/25 dark:bg-emerald-500/24 dark:shadow-none dark:hover:shadow-none">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">In Progress</p>
                  <p className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-100">{hero.inProgressCount}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-200">Healthy SLAs</p>
                  <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-emerald-600/90 dark:text-emerald-200/85">Whole platform data</p>
                </div>
                <span className="rounded-xl border border-emerald-200 bg-white/80 p-2 text-emerald-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 dark:border-emerald-400/35 dark:bg-slate-800/70 dark:text-emerald-200">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-rose-200 bg-rose-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-rose-400/25 dark:bg-rose-500/24 dark:shadow-none dark:hover:shadow-none">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">Breached</p>
                  <p className="mt-1 text-2xl font-black text-rose-900 dark:text-rose-100">{hero.breachedCount}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-200">Needs review</p>
                  <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-rose-600/90 dark:text-rose-200/85">Whole platform data</p>
                </div>
                <span className="rounded-xl border border-rose-200 bg-white/80 p-2 text-rose-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 dark:border-rose-400/35 dark:bg-slate-800/70 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-sky-200 bg-sky-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-sky-400/25 dark:bg-sky-500/24 dark:shadow-none dark:hover:shadow-none">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">Delayed</p>
                  <p className="mt-1 text-2xl font-black text-sky-900 dark:text-sky-100">{hero.delayedCount}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-200">At risk SLAs</p>
                  <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-sky-600/90 dark:text-sky-200/85">Whole platform data</p>
                </div>
                <span className="rounded-xl border border-sky-200 bg-white/80 p-2 text-sky-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 dark:border-sky-400/35 dark:bg-slate-800/70 dark:text-sky-200">
                  <Eye className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-indigo-200 bg-white/90 shadow-sm dark:border-indigo-400/20 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/96 dark:to-slate-800 dark:shadow-none">
          <CardContent className="p-3.5 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-3">
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:h-11 sm:text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={contractStatusFilter}
                onValueChange={(v) => {
                  setContractStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:h-11 sm:text-sm"><SelectValue placeholder="Contract Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="breached">Breached</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={slaStatusFilter}
                onValueChange={(v) => {
                  setSlaStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:h-11 sm:text-sm"><SelectValue placeholder="SLA Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="breached">Breached</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Loading SLA contracts…</p>
        ) : null}

        <div className="space-y-3 sm:space-y-4">
          {filteredSlas.map((sla, index) => {
            const statusConfig = statusStyles[sla.contractStatus] || statusStyles['in-progress'];
            return (
              <Card key={sla.id} className="cs-card-rise group relative overflow-hidden border-indigo-300 bg-white shadow-[0_10px_24px_rgba(79,70,229,0.1)] transition-all duration-300 hover:border-indigo-400 hover:shadow-[0_14px_30px_rgba(79,70,229,0.2)] dark:border-slate-700 dark:bg-slate-900/88 dark:shadow-none dark:hover:border-indigo-400/35 dark:hover:shadow-none" style={{ animationDelay: `${120 + index * 90}ms` }}>
                <div className={`absolute left-0 top-0 h-full w-2 bg-gradient-to-b ${statusConfig.accent}`} />
                <CardContent className="relative p-3 pl-5 sm:p-5 sm:pl-7">
                  <div className="mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 sm:text-xl dark:text-slate-100">{sla.request}</h3>
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-300">{sla.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                        <span className="font-medium text-indigo-700 dark:text-indigo-200">Client:</span>
                        <UserAvatar
                          userId={sla.clientId}
                          name={sla.client}
                          profilePictureUrl={sla.clientProfilePictureUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <Badge variant="outline" className="border-indigo-400 bg-indigo-200 px-2 py-0.5 text-[11px] text-indigo-950 sm:px-2.5 sm:py-1 sm:text-xs dark:border-indigo-400/30 dark:bg-indigo-500/18 dark:text-indigo-100">{sla.category || '—'}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${statusConfig.badge}`}>
                        {sla.contractStatus === 'in-progress'
                          ? 'In Progress'
                          : sla.contractStatus === 'breached'
                            ? 'Breached'
                            : sla.contractStatus === 'delayed'
                              ? 'Delayed'
                              : 'Completed'}
                      </Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${slaStatusStyles[sla.slaStatus] || 'border-slate-400 bg-slate-300 text-slate-800 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-100'}`}>
                        SLA: {sla.slaStatus}
                      </Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${warningLevelStyles[sla.warningLevel] || 'border-slate-300 bg-slate-100 text-slate-700'}`}>
                        Warning: {sla.warningLevel}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 sm:p-3 dark:border-emerald-400/25 dark:bg-emerald-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-200">Vendor</p>
                      <div className="mt-1">
                        <UserAvatar
                          userId={sla.vendorId}
                          name={sla.vendor}
                          profilePictureUrl={sla.vendorProfilePictureUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:p-3 dark:border-indigo-400/25 dark:bg-indigo-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Price</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">{sla.price}</p>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:p-3 dark:border-indigo-400/25 dark:bg-indigo-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Created At</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">{sla.createdAt}</p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 sm:p-3 dark:border-sky-400/25 dark:bg-sky-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-200">Deadline</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">{sla.deadline}</p>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:p-3 dark:border-indigo-400/25 dark:bg-indigo-500/14">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Days Remaining</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                        <Clock3
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            sla.contractStatus === 'breached'
                              ? 'text-rose-700 dark:text-rose-200'
                              : sla.contractStatus === 'delayed'
                                ? 'text-sky-700 dark:text-sky-200'
                                : sla.contractStatus === 'completed'
                                  ? 'text-emerald-700 dark:text-emerald-200'
                                  : 'text-indigo-700 dark:text-indigo-200'
                          }`}
                        />
                        {sla.daysRemaining} days
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 p-2.5 sm:p-3 dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-indigo-500/12 dark:to-sky-500/12">
                    <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">SLA Progress</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:px-2.5 sm:py-1 sm:text-xs dark:border-indigo-400/30 dark:bg-slate-900/80 dark:text-indigo-100">
                        {sla.progress}%
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-indigo-100 sm:h-3 dark:bg-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          sla.contractStatus === 'delayed'
                            ? 'bg-sky-700'
                            : sla.contractStatus === 'breached'
                              ? 'bg-rose-700'
                              : sla.contractStatus === 'completed'
                                ? 'bg-emerald-700'
                                : 'bg-indigo-700'
                        }`}
                        style={{ width: `${sla.progress}%` }}
                      />
                    </div>
                    {(sla.contractStatus === 'delayed' || sla.contractStatus === 'breached') && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 dark:text-rose-200 sm:mt-3 sm:gap-2 sm:text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Attention: SLA requires immediate follow-up.
                      </p>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-3 gap-2 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/35 dark:bg-slate-800 dark:text-indigo-100 dark:hover:bg-indigo-500/16">
                        <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-200" />
                        View SLA Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>SLA Agreement Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Request</p>
                            <p className="font-medium">{sla.request}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Client</p>
                            <UserAvatar userId={sla.clientId} name={sla.client} profilePictureUrl={sla.clientProfilePictureUrl} size="xs" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Vendor</p>
                            <UserAvatar userId={sla.vendorId} name={sla.vendor} profilePictureUrl={sla.vendorProfilePictureUrl} size="xs" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Budget</p>
                            <p className="font-medium">{sla.price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Contract Status</p>
                            <p className="font-medium capitalize">{sla.contractStatus}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">SLA Status</p>
                            <p className="font-medium capitalize">{sla.slaStatus}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Warning Level</p>
                            <p className="font-medium capitalize">{sla.warningLevel}</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm text-gray-600 dark:text-slate-300">Terms</p>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            <li>Completion by {sla.deadline}</li>
                            <li>Regular progress updates required</li>
                            <li>7% platform commission</li>
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && filteredSlas.length === 0 && (
            <Card className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900/86">
              <CardContent className="p-10 text-center text-slate-500">
                No SLA records match the selected filters.
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && contractsTotal > 0 ? (
          <Card className="border-indigo-200 bg-white/90 shadow-sm dark:border-indigo-400/25 dark:bg-slate-900/86 dark:shadow-none">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-200">
                Page {currentPage} of {totalPages} · {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, contractsTotal)} of {contractsTotal}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-indigo-500/16"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isRefreshing}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-indigo-500/16"
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
