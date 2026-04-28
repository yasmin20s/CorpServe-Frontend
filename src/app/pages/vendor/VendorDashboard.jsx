import DashboardLayout from '../../components/DashboardLayout';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  FileStack,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { getVendorDashboardApi } from '../../services/dashboardApi';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'My Proposals', path: '/vendor/my-proposals', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];

const EMPTY_VENDOR_DASHBOARD = {
  vendorQuickStats: {
    activeContracts: 0,
    activeContractsChangeThisWeek: 0,
    revenueThisMonthEGP: 0,
    revenuePercent: 0,
    avgRating: 0,
    totalRatingCount: 0,
  },
  earningsOverTimes: [],
  proposalWinRate: {
    submitted: 0,
    accepted: 0,
    rejected: 0,
    winRatePercent: 0,
  },
  activeContracts: [],
  upcomingDeadlines: [],
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(EMPTY_VENDOR_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const payload = await getVendorDashboardApi({ token: user?.token });
        if (!cancelled) {
          setDashboardData({
            ...EMPTY_VENDOR_DASHBOARD,
            ...payload,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardData(EMPTY_VENDOR_DASHBOARD);
          setErrorMessage(error?.message || 'Could not load vendor dashboard.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  const quickStats = dashboardData.vendorQuickStats ?? EMPTY_VENDOR_DASHBOARD.vendorQuickStats;
  const proposalWin = dashboardData.proposalWinRate ?? EMPTY_VENDOR_DASHBOARD.proposalWinRate;
  const proposalWinRate = Math.round(Number(proposalWin.winRatePercent || 0));
  const submittedProposals = Number(proposalWin.submitted || 0);
  const acceptedProposals = Number(proposalWin.accepted || 0);
  const rejectedProposals = Number(proposalWin.rejected || 0);
  const activeContractsCount = Number(quickStats.activeContracts || 0);
  const avgRating = Number(quickStats.avgRating || 0).toFixed(1);
  const ratingsCount = Number(quickStats.totalRatingCount || 0);
  const revenueThisMonthInThousands = Number(quickStats.revenueThisMonthEGP || 0) / 1000;
  const revenueThisMonthLabel = `${revenueThisMonthInThousands.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}k`;

  const momentumData = useMemo(
    () =>
      (dashboardData.earningsOverTimes ?? []).map((item, index) => ({
        month: item.monthLabel || '',
        billed: Number(item.billedEGP || 0) / 1000,
        received: Number(item.receivedEGP || 0) / 1000,
        target: (Number(item.receivedEGP || 0) * 0.92) / 1000 + (index % 2 === 0 ? 1 : -0.6),
      })),
    [dashboardData.earningsOverTimes],
  );

  const activeContracts = useMemo(
    () =>
      (dashboardData.activeContracts ?? []).map((item) => {
        const percent = Math.max(0, Math.min(100, Number(item.progressPercent || 0)));
        const statusRaw = String(item.contractStatus || '').toLowerCase();
        const status = statusRaw.includes('delay')
          ? 'at-risk'
          : statusRaw.includes('progress')
            ? 'in-progress'
            : 'active';
        return {
          label: item.requestTitle || 'Request',
          value: `${percent}%`,
          amount: `${item.clientName || 'Client'} · ${item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}`,
          status,
          icon: status === 'at-risk' ? AlertTriangle : status === 'in-progress' ? Activity : Briefcase,
        };
      }),
    [dashboardData.activeContracts],
  );

  const upcomingDeadlines = useMemo(
    () =>
      (dashboardData.upcomingDeadlines ?? []).map((item) => {
        const urgency = String(item.urgencyLevel || '').toLowerCase();
        const tone = urgency === 'red'
          ? 'bg-rose-500'
          : urgency === 'orange'
            ? 'bg-amber-500'
            : urgency === 'green'
              ? 'bg-emerald-500'
              : 'bg-sky-500';
        const borderHex = urgency === 'red'
          ? '#f43f5e'
          : urgency === 'orange'
            ? '#f59e0b'
            : urgency === 'green'
              ? '#10b981'
              : '#0ea5e9';
        return {
          date: item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--',
          title: item.requestTitle || 'Request',
          client: item.clientName || 'Client',
          tone,
          borderHex,
        };
      }),
    [dashboardData.upcomingDeadlines],
  );

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-pink-700 to-blue-700 p-8 text-white shadow-2xl hover:shadow-4xl transition-shadow duration-500">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/50 via-pink-300/30 to-blue-300/40 animate-shimmer" />
          </div>
          <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute left-1/2 bottom-0 -ml-32 -mb-20 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black sm:text-5xl">Vendor Dashboard</h1>
            <p className="mt-2 text-lg text-white/90">Your performance hub at a glance</p>
            {errorMessage ? <p className="mt-2 text-sm text-rose-100">{errorMessage}</p> : null}
            {isLoading ? <p className="mt-2 text-sm text-white/80">Loading dashboard data...</p> : null}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Active Contracts */}
          <Card className="h-full overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg transition-all hover:shadow-2xl dark:border-purple-400/35 dark:from-[#1a1038] dark:to-[#13233e]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white">
                  <Briefcase className="h-6 w-6" />
                </span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">{activeContractsCount}</span>
              </div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Active Contracts</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">↑ 1 this week</p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="h-full overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-pink-50 to-rose-50 shadow-lg transition-all hover:shadow-2xl dark:border-rose-400/35 dark:from-[#2a1030] dark:to-[#261730]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                  <Wallet className="h-6 w-6" />
                </span>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">{revenueThisMonthLabel}</span>
              </div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Revenue This Month</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">{Number(quickStats.revenuePercent || 0) >= 0 ? '↑' : ''}{quickStats.revenuePercent || 0}%</p>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card className="h-full overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg transition-all hover:shadow-2xl dark:border-sky-400/35 dark:from-[#121f38] dark:to-[#132939]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white">
                  <TrendingUp className="h-6 w-6" />
                </span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600">{avgRating}</span>
              </div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Avg Rating</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">from {ratingsCount} ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Add Open Proposals back to KPI */}
        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2 overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white to-purple-50 shadow-lg dark:border-purple-400/35 dark:from-[#160f35] dark:to-[#1a1638]">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700">Earnings Over Time</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Billed vs received analysis</p>
                </div>
                <div className="inline-flex rounded-full bg-gradient-to-r from-purple-100 to-pink-100 p-1 dark:from-violet-500/18 dark:to-fuchsia-500/18">
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={momentumData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(2,6,23,0.2)',
                      color: 'var(--card-foreground)',
                    }}
                    labelStyle={{ color: 'var(--card-foreground)' }}
                    itemStyle={{ color: 'var(--card-foreground)' }}
                  />
                  <Line type="monotone" dataKey="billed" stroke="#a855f7" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="received" stroke="#06b6d4" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-pink-200/80 bg-gradient-to-br from-white to-pink-50 shadow-lg dark:border-pink-400/35 dark:from-[#1e1137] dark:to-[#24112d]">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-rose-600">Proposal Win Rate</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Performance metric</p>
              </div>
              <div className="flex justify-center">
                <div
                  className="relative grid h-48 w-48 place-items-center rounded-full shadow-lg"
                  style={{
                    background: `conic-gradient(#a855f7 ${proposalWinRate}%, var(--muted) ${proposalWinRate}% 100%)`,
                  }}
                >
                  <div className="grid h-40 w-40 place-items-center rounded-full border border-slate-200 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-900/90">
                    <div className="text-center">
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{proposalWinRate}%</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Win Rate</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{submittedProposals}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submitted</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{acceptedProposals}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accepted</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-300">{rejectedProposals}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Contracts & Deadlines */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50 shadow-lg dark:border-indigo-400/35 dark:from-[#141e38] dark:to-[#171d3f]">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700 mb-5">Active Contracts</h3>
              <div className="space-y-3">
                {activeContracts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 p-4 text-sm text-indigo-700 dark:border-indigo-400/35 dark:bg-slate-900/70 dark:text-indigo-200">
                    No active contracts right now.
                  </div>
                ) : null}
                {activeContracts.map((item) => {
                  const Icon = item.icon;
                  const statusColors = {
                    'in-progress': 'border-l-4 border-l-emerald-500 bg-emerald-100 text-emerald-700 dark:border-l-emerald-300 dark:bg-emerald-500/18 dark:text-emerald-200',
                    'at-risk': 'border-l-4 border-l-amber-500 bg-amber-100 text-amber-700 dark:border-l-amber-300 dark:bg-amber-500/18 dark:text-amber-200',
                    active: 'border-l-4 border-l-indigo-500 bg-indigo-100 text-indigo-700 dark:border-l-indigo-300 dark:bg-indigo-500/18 dark:text-indigo-200',
                  };
                  return (
                    <div key={item.label} className={`flex items-center gap-3 p-4 rounded-xl ${statusColors[item.status]} hover:shadow-md transition-all`}>
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/50 dark:bg-slate-900/45">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.label}</p>
                        <p className="text-xs opacity-75 truncate">{item.amount}</p>
                      </div>
                      <div className="text-right">
                        <div className="mb-1 h-1 w-24 overflow-hidden rounded-full bg-white/40 dark:bg-slate-700/70">
                          <div className="h-full rounded-full bg-white dark:bg-slate-200" style={{ width: item.value }} />
                        </div>
                        <p className="text-sm font-bold">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white to-blue-50 shadow-lg dark:border-sky-400/35 dark:from-[#121f35] dark:to-[#13273a]">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 mb-5">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-sky-200 bg-white/70 p-4 text-sm text-sky-700 dark:border-sky-400/35 dark:bg-slate-900/70 dark:text-sky-200">
                    No upcoming deadlines.
                  </div>
                ) : null}
                {upcomingDeadlines.map((deadline) => (
                  <div key={`${deadline.date}-${deadline.title}`} className="flex items-start gap-3 rounded-xl border-l-4 bg-gradient-to-r from-slate-50 to-slate-100 p-4 transition-all hover:shadow-md dark:from-slate-900/80 dark:to-slate-800/70" style={{ borderColor: deadline.borderHex }}>
                    <span className={`mt-1 h-3 w-3 rounded-full ${deadline.tone} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{deadline.date}</p>
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{deadline.title}</p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300">{deadline.client}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
