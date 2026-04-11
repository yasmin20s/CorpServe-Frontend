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
  Sparkles,
  ArrowUpRight,
  Clock3,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getCategoriesApi } from '../../services/categoriesApi';
import { getAdminSlasApi } from '../../services/adminMonitorApi';

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
  'in-progress': {
    badge: 'border-violet-400 bg-violet-200 text-violet-950',
    accent: 'from-violet-600/60 via-fuchsia-500/35 to-indigo-500/25',
  },
  delayed: {
    badge: 'border-fuchsia-400 bg-fuchsia-200 text-fuchsia-950',
    accent: 'from-fuchsia-600/60 via-rose-500/35 to-violet-500/25',
  },
  completed: {
    badge: 'border-purple-400 bg-purple-200 text-purple-950',
    accent: 'from-purple-600/60 via-violet-500/35 to-fuchsia-500/25',
  },
};

const slaStatusStyles = {
  active: 'border-violet-300 bg-violet-100 text-violet-900',
  breached: 'border-rose-300 bg-rose-100 text-rose-900',
  completed: 'border-purple-300 bg-purple-100 text-purple-900',
};

const warningLevelStyles = {
  none: 'border-slate-300 bg-slate-100 text-slate-700',
  low: 'border-sky-300 bg-sky-100 text-sky-900',
  medium: 'border-amber-300 bg-amber-100 text-amber-900',
  high: 'border-rose-300 bg-rose-100 text-rose-900',
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

function formatDateShort(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

function contractSlugToInt(slug) {
  if (slug === 'in-progress') return 1;
  if (slug === 'delayed') return 2;
  if (slug === 'completed') return 3;
  return undefined;
}

function slaUiToInt(slug) {
  if (slug === 'active') return 1;
  if (slug === 'breached') return 2;
  if (slug === 'completed') return 3;
  return undefined;
}

export default function SLAMonitor() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [hero, setHero] = useState({
    totalSlaContracts: 0,
    inProgressCount: 0,
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
        delayedCount: result.delayedCount,
        completedCount: result.completedCount,
      });

      setContractsTotal(result.contracts.count);
      const rows = result.contracts.data.map((c) => ({
        id: c.slaContractId,
        request: c.requestTitle,
        description: c.description,
        client: c.clientName,
        vendor: c.vendorName,
        category: c.categoryName,
        price: formatMoneyEGP(c.price),
        createdAt: formatDateShort(c.createdAt),
        deadline: formatDateShort(c.deadline),
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
      <div className="space-y-4 lg:space-y-7">
        <Card className="border-violet-300 bg-gradient-to-r from-violet-200 via-fuchsia-200 to-indigo-200 shadow-[0_18px_45px_rgba(109,40,217,0.28)]">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300 bg-white/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-900 sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
                  SLA Timeline
                </div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-4xl">SLA Monitor</h1>
                <p className="mt-1 text-sm text-violet-950/80 sm:text-base">Timeline layout for tracking agreement health, deadline proximity, and response urgency.</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Total</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{hero.totalSlaContracts}</p>
                  </div>
                  <div className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-700">In progress</p>
                    <p className="mt-1 text-xl font-bold text-violet-900">{hero.inProgressCount}</p>
                  </div>
                  <div className="rounded-xl border border-fuchsia-400 bg-fuchsia-100 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-700">Delayed</p>
                    <p className="mt-1 text-xl font-bold text-fuchsia-900">{hero.delayedCount}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-400 bg-indigo-100 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-700">Completed</p>
                    <p className="mt-1 text-xl font-bold text-indigo-900">{hero.completedCount}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 border-violet-400 bg-white text-violet-900 hover:bg-violet-50"
                  onClick={() => loadSlas({ silent: true })}
                  disabled={isRefreshing || !user?.token}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-300 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 shadow-sm">
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
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-sm font-medium text-violet-800">Loading SLA contracts…</p>
        ) : null}

        <div className="space-y-3 sm:space-y-4">
          {filteredSlas.map((sla, index) => {
            const statusConfig = statusStyles[sla.contractStatus] || statusStyles['in-progress'];
            return (
              <Card key={sla.id} className="cs-card-rise group relative overflow-hidden border-violet-300 bg-white shadow-sm transition-all duration-300 hover:border-violet-500 hover:shadow-[0_16px_36px_rgba(109,40,217,0.22)]" style={{ animationDelay: `${120 + index * 90}ms` }}>
                <div className={`absolute left-0 top-0 h-full w-2 bg-gradient-to-b ${statusConfig.accent}`} />
                <CardContent className="relative p-3 pl-5 sm:p-5 sm:pl-7">
                  <div className="mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 sm:text-xl">{sla.request}</h3>
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">{sla.description}</p>
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">Client: {sla.client}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <Badge variant="outline" className="border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-900 sm:px-2.5 sm:py-1 sm:text-xs">{sla.category || '—'}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${statusConfig.badge}`}>
                        {sla.contractStatus === 'in-progress' ? 'In Progress' : sla.contractStatus === 'delayed' ? 'Delayed' : 'Completed'}
                      </Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${slaStatusStyles[sla.slaStatus] || 'border-slate-400 bg-slate-300 text-slate-800'}`}>
                        SLA: {sla.slaStatus}
                      </Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${warningLevelStyles[sla.warningLevel] || 'border-slate-300 bg-slate-100 text-slate-700'}`}>
                        Warning: {sla.warningLevel}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5 sm:p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{sla.vendor}</p>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Price</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{sla.price}</p>
                    </div>
                    <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-2.5 sm:p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Created At</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{sla.createdAt}</p>
                    </div>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5 sm:p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deadline</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{sla.deadline}</p>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 sm:p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Days Remaining</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 sm:text-sm">
                        <Clock3 className="h-3.5 w-3.5 text-violet-700 sm:h-4 sm:w-4" />
                        {sla.daysRemaining} days
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-2.5 sm:p-3">
                    <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">SLA Progress</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-violet-900 sm:px-2.5 sm:py-1 sm:text-xs">
                        {sla.progress}%
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-violet-100 sm:h-3">
                      <div className={`h-full transition-all duration-500 ${sla.contractStatus === 'delayed' ? 'bg-fuchsia-700' : sla.contractStatus === 'completed' ? 'bg-purple-700' : 'bg-violet-800'}`} style={{ width: `${sla.progress}%` }} />
                    </div>
                    {sla.contractStatus === 'delayed' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-800 sm:mt-3 sm:gap-2 sm:text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Attention: SLA requires immediate follow-up.
                      </p>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-3 gap-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100">
                        <Eye className="w-4 h-4" />
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
                            <p className="text-sm text-gray-600">Request</p>
                            <p className="font-medium">{sla.request}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Client</p>
                            <p className="font-medium">{sla.client}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Vendor</p>
                            <p className="font-medium">{sla.vendor}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Budget</p>
                            <p className="font-medium">{sla.price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Contract Status</p>
                            <p className="font-medium capitalize">{sla.contractStatus}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">SLA Status</p>
                            <p className="font-medium capitalize">{sla.slaStatus}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Warning Level</p>
                            <p className="font-medium capitalize">{sla.warningLevel}</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm text-gray-600">Terms</p>
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
            <Card className="border-slate-300 bg-white">
              <CardContent className="p-10 text-center text-slate-500">
                No SLA records match the selected filters.
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && contractsTotal > 0 ? (
          <Card className="border-violet-200 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-800">
                Page {currentPage} of {totalPages} · {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, contractsTotal)} of {contractsTotal}
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
