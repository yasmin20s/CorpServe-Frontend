import { useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Sparkles, Clock3, AlertTriangle, CircleDollarSign, ArrowUpRight, CheckCircle2 } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Vendor Approvals', path: '/admin/vendor-approvals', icon: <UserCheck className="w-5 h-5"/> },
    { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5"/> },
    { label: 'Categories', path: '/admin/categories', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Requests Monitor', path: '/admin/requests-monitor', icon: <FileText className="w-5 h-5"/> },
    { label: 'SLA Monitor', path: '/admin/sla-monitor', icon: <FileText className="w-5 h-5"/> },
    { label: 'Payments Monitor', path: '/admin/payments-monitor', icon: <DollarSign className="w-5 h-5"/> },
    { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const requests = [
    {
      id: '1',
      title: 'IT Infrastructure Setup',
      description: 'Deploy network racks, endpoint security, and office-wide connectivity for 3 branches.',
      client: 'Acme Corp',
      vendor: 'TechPro',
      category: 'IT Support',
      status: 'active',
      slaStatus: 'active',
      progress: 65,
      price: 'EGP 6,500',
      deadline: '2026-05-02',
      proposals: [
        { id: 'p-11', vendorName: 'TechPro', price: 'EGP 6,500', eta: '14 days', status: 'approved' },
        { id: 'p-12', vendorName: 'NetCore', price: 'EGP 6,850', eta: '16 days', status: 'review' },
      ],
    },
    {
      id: '2',
      title: 'Security System Installation',
      description: 'Install CCTV, biometric access control, and a central monitoring unit.',
      client: 'StartupXYZ',
      vendor: null,
      category: 'Security',
      status: 'pending',
      slaStatus: 'n/a',
      progress: 0,
      price: 'EGP 15,000',
      deadline: '2026-05-20',
      proposals: [
        { id: 'p-21', vendorName: 'SecureGuard', price: 'EGP 15,000', eta: '20 days', status: 'submitted' },
        { id: 'p-22', vendorName: 'SafeZone', price: 'EGP 14,600', eta: '22 days', status: 'submitted' },
        { id: 'p-23', vendorName: 'CCTV Masters', price: 'EGP 16,200', eta: '18 days', status: 'submitted' },
      ],
    },
    {
      id: '3',
      title: 'Marketing Campaign',
      description: 'Launch a 6-week omnichannel campaign with social, paid search, and creative assets.',
      client: 'BizCo',
      vendor: 'Creative Agency',
      category: 'Marketing',
      status: 'active',
      slaStatus: 'at-risk',
      progress: 40,
      price: 'EGP 12,000',
      deadline: '2026-04-28',
      proposals: [
        { id: 'p-31', vendorName: 'Creative Agency', price: 'EGP 12,000', eta: '10 days', status: 'approved' },
        { id: 'p-32', vendorName: 'BrightMedia', price: 'EGP 11,500', eta: '12 days', status: 'review' },
      ],
    },
];

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
};

const slaStyles = {
  active: 'border-violet-400 bg-violet-200 text-violet-950',
  'at-risk': 'border-fuchsia-400 bg-fuchsia-200 text-fuchsia-950',
  'n/a': 'border-slate-400 bg-slate-300 text-slate-800',
};

const parsePrice = (price) => Number(price.replace(/[^\d]/g, ''));

const formatCompactCurrency = (value) => {
  if (value >= 1000) {
    return `EGP ${(value / 1000).toFixed(1)}K`;
  }
  return `EGP ${value}`;
};

export default function RequestsMonitor() {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [slaFilter, setSlaFilter] = useState('all');

    const filteredRequests = useMemo(() => requests.filter((request) => {
      const categoryMatched = categoryFilter === 'all' || request.category === categoryFilter;
      const statusMatched = statusFilter === 'all' || request.status === statusFilter;
      const slaMatched = slaFilter === 'all' || request.slaStatus === slaFilter;
      return categoryMatched && statusMatched && slaMatched;
    }), [categoryFilter, slaFilter, statusFilter]);

    const totalRequests = filteredRequests.length;
    const activeRequests = filteredRequests.filter((request) => request.status === 'active').length;
    const pendingRequests = filteredRequests.filter((request) => request.status === 'pending').length;
    const atRiskSla = filteredRequests.filter((request) => request.slaStatus === 'at-risk').length;
    const avgProgress = Math.round(filteredRequests.reduce((sum, request) => sum + request.progress, 0) / (totalRequests || 1));
    const totalBudget = filteredRequests.reduce((sum, request) => sum + parsePrice(request.price), 0);

    return (<DashboardLayout menuItems={menuItems} userRole="admin">
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

            <div className="grid w-full gap-2.5 sm:grid-cols-2 sm:gap-4 xl:max-w-lg">
              <div className="rounded-lg border border-violet-300 bg-violet-50/90 p-3 shadow-sm sm:rounded-2xl sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Total Budget</p>
                <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-3xl">{formatCompactCurrency(totalBudget)}</p>
              </div>
              <div className="rounded-lg border border-violet-300 bg-violet-50/90 p-3 shadow-sm sm:rounded-2xl sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Avg Progress</p>
                <p className="mt-1 text-lg font-bold text-violet-950 sm:mt-2 sm:text-3xl">{avgProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-violet-400 bg-gradient-to-br from-violet-200 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-violet-900 sm:text-sm">Active Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{activeRequests}</p>
            </CardContent>
          </Card>
          <Card className="border-indigo-400 bg-gradient-to-br from-indigo-200 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-indigo-900 sm:text-sm">Pending Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{pendingRequests}</p>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-400 bg-gradient-to-br from-fuchsia-200 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-fuchsia-900 sm:text-sm">SLA At Risk</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{atRiskSla}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-500 bg-gradient-to-br from-slate-300 to-white shadow-sm">
            <CardContent className="p-3.5 sm:p-6">
              <p className="text-xs font-semibold text-slate-800 sm:text-sm">All Requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-4xl">{totalRequests}</p>
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
                <SelectTrigger className="h-10 text-xs sm:h-12 sm:text-base"><SelectValue placeholder="All Categories"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="IT Support">IT Support</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs sm:h-12 sm:text-base"><SelectValue placeholder="All Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger className="h-10 text-xs sm:h-12 sm:text-base"><SelectValue placeholder="SLA Compliance"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="n/a">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2.5 sm:space-y-5">
          {filteredRequests.map((request, index) => {
            const statusConfig = statusStyles[request.status] || statusStyles.pending;

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
                      <Badge variant="outline" className="border-violet-400 bg-violet-200 px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm text-violet-950">{request.category}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${statusConfig.badge}`}>{request.status}</Badge>
                      <Badge className={`border px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm ${slaStyles[request.slaStatus] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        SLA: {request.slaStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg">{request.vendor || 'Unassigned vendor'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Price</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg">{request.price}</p>
                    </div>
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deadline</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-lg">{request.deadline}</p>
                    </div>
                    <div className="rounded-lg border border-slate-400 bg-slate-200 p-2.5 sm:rounded-2xl sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Status Snapshot</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 sm:mt-2 sm:gap-2 sm:text-base">
                        {request.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" /> : <Clock3 className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />}
                        {request.status === 'active' ? 'In Progress' : 'Waiting Assignment'}
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
                    {request.slaStatus === 'at-risk' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 sm:mt-3 sm:gap-2 sm:text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Attention: this request is approaching SLA risk.
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
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm">Price: {proposal.price}</p>
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

          {filteredRequests.length === 0 && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-10 text-center text-slate-500">
                No requests match the selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>);
}
