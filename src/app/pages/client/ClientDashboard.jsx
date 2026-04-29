import DashboardLayout from '../../components/DashboardLayout';
import EmptyChartMessage from '../../components/EmptyChartMessage';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  FileStack,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  ReceiptText,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router';
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getClientDashboardApi } from '../../services/dashboardApi';
import { startCheckoutApi } from '../../services/paymentsApi';
import { toast } from '../../lib/toast';

const menuItems = [
  { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5" /> },
  { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5" /> },
  { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5" /> },
  { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5" /> },
];

const metricCardStyles = [
  {
    title: 'Active Requests',
    subtitleTone: 'text-slate-600 dark:text-cyan-200',
    icon: Activity,
    iconTone: 'text-sky-700 dark:text-cyan-200',
    iconWrap: 'bg-sky-100 ring-slate-200 dark:bg-cyan-500/14 dark:ring-cyan-300/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
    borderTone: 'border-slate-200/90 dark:border-cyan-400/55',
  },
  {
    title: 'Pending Proposals',
    subtitleTone: 'text-slate-700 dark:text-violet-200',
    icon: FileStack,
    iconTone: 'text-indigo-700 dark:text-violet-200',
    iconWrap: 'bg-indigo-100 ring-slate-200 dark:bg-violet-500/14 dark:ring-violet-300/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
    borderTone: 'border-slate-200/90 dark:border-violet-400/55',
  },
  {
    title: 'Total Spent',
    subtitleTone: 'text-slate-600 dark:text-cyan-200',
    icon: Wallet,
    iconTone: 'text-cyan-700 dark:text-sky-200',
    iconWrap: 'bg-cyan-100 ring-slate-200 dark:bg-sky-500/14 dark:ring-sky-300/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
    borderTone: 'border-slate-200/90 dark:border-sky-400/55',
  },
  {
    title: 'Completed Services',
    subtitleTone: 'text-slate-600 dark:text-cyan-200',
    icon: CheckCircle2,
    iconTone: 'text-violet-700 dark:text-indigo-200',
    iconWrap: 'bg-violet-100 ring-slate-200 dark:bg-indigo-500/14 dark:ring-indigo-300/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
    borderTone: 'border-slate-200/90 dark:border-indigo-400/55',
  },
];

const ACTIVITY_COLORS = {
  created: '#7f5cff',
  completed: '#22c1e7',
};

const CATEGORY_COLORS = ['#22c1e7', '#6d3fd8', '#2e73e8', '#7f5cff', '#5b21b6'];
const EMPTY_CLIENT_DASHBOARD = {
  quickStats: {
    activeRequests: 0,
    activeRequestsChangeThisWeek: 0,
    pendingProposals: 0,
    newProposalToday: 0,
    totalSpentEGP: 0,
    totalSpentChangePercent: 0,
    completedRequests: 0,
    completedRequestsThisMonth: 0,
  },
  requestActivities: [],
  categoryBreakdowns: [],
  recentRequests: [],
  pendingPayments: [],
};

const quickActions = [
  { title: 'New Request', path: '/client/create-request', icon: PlusCircle },
  { title: 'View Requests', path: '/client/my-requests', icon: ReceiptText },
  { title: 'My Payments', path: '/client/payments', icon: CircleDollarSign },
  { title: 'Chat with Vendors', path: '/client/chat', icon: MessageSquare },
];

function statusPillClass(status) {
  if (status === 'Completed') {
    return 'border border-emerald-200 bg-emerald-100/90 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-200';
  }
  if (status === 'In Progress' || status === 'Active') {
    return 'border border-sky-200 bg-sky-100/90 text-sky-800 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-200';
  }
  if (status.startsWith('Proposals')) {
    return 'border border-violet-200 bg-violet-100/90 text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-200';
  }
  return 'border border-amber-200 bg-amber-100/90 text-amber-800 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-200';
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

function formatCurrency(value) {
  return `EGP ${formatNumber(value)}`;
}

function formatSigned(value) {
  const numeric = Number(value) || 0;
  if (numeric > 0) return `+${numeric}`;
  return `${numeric}`;
}

function formatDateMMMDay(value) {
  if (!value) return '--';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return format(parsedDate, 'MMM d');
}

function formatDateLong(value) {
  if (!value) return '--';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return format(parsedDate, 'dd MMM yyyy');
}

function toBudgetLabel(minValue, maxValue) {
  const min = Number(minValue) || 0;
  const max = Number(maxValue) || 0;
  if (min > 0 && max > 0 && min !== max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  return formatCurrency(max || min);
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const clientName = String(user?.fullName || 'Client').trim() || 'Client';
  const [dashboardData, setDashboardData] = useState(EMPTY_CLIENT_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [payingPaymentId, setPayingPaymentId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const payload = await getClientDashboardApi({ token: user?.token });
        if (!cancelled) {
          setDashboardData({
            ...EMPTY_CLIENT_DASHBOARD,
            ...payload,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardData(EMPTY_CLIENT_DASHBOARD);
          setErrorMessage(error?.message || 'Could not load dashboard data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  const quickStats = dashboardData.quickStats ?? EMPTY_CLIENT_DASHBOARD.quickStats;
  const metricCards = useMemo(
    () => [
      {
        ...metricCardStyles[0],
        value: formatNumber(quickStats.activeRequests),
        subtitle: `${formatSigned(quickStats.activeRequestsChangeThisWeek)} this week`,
      },
      {
        ...metricCardStyles[1],
        value: formatNumber(quickStats.pendingProposals),
        subtitle: `${formatNumber(quickStats.newProposalToday)} new today`,
      },
      {
        ...metricCardStyles[2],
        value: formatCurrency(quickStats.totalSpentEGP),
        subtitle: `${formatSigned(quickStats.totalSpentChangePercent)}% vs last month`,
      },
      {
        ...metricCardStyles[3],
        value: formatNumber(quickStats.completedRequests),
        subtitle: `${formatSigned(quickStats.completedRequestsThisMonth)} this month`,
      },
    ],
    [quickStats],
  );
  const requestActivityData = useMemo(
    () =>
      (dashboardData.requestActivities ?? []).map((item) => ({
        day: item.dayLabel || formatDateMMMDay(item.date),
        created: Number(item.created || 0),
        completed: Number(item.completed || 0),
      })),
    [dashboardData.requestActivities],
  );
  const categoryData = useMemo(
    () =>
      (dashboardData.categoryBreakdowns ?? []).map((item, index) => ({
        name: item.category,
        value: Number(item.percentage || 0),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    [dashboardData.categoryBreakdowns],
  );
  const totalCategoryRequests = useMemo(
    () => (dashboardData.categoryBreakdowns ?? []).reduce((total, item) => total + Number(item.requestCount || 0), 0),
    [dashboardData.categoryBreakdowns],
  );
  const recentRequests = useMemo(
    () =>
      (dashboardData.recentRequests ?? []).map((request) => ({
        requestId: request.requestId,
        title: request.title,
        category: request.requestCategory,
        status: request.statusDisplay || request.status || 'Pending',
        budget: toBudgetLabel(request.budgetMin, request.budgetMax),
        date: formatDateMMMDay(request.deadline),
      })),
    [dashboardData.recentRequests],
  );
  const pendingPayments = useMemo(
    () =>
      (dashboardData.pendingPayments ?? []).map((payment) => ({
        paymentId: payment.paymentId,
        requestId: payment.requestId,
        title: payment.requestTitle,
        invoice: payment.merchantOrderId,
        invoiceDate: formatDateLong(payment.createdAt),
        amount: formatCurrency(payment.amount),
        commissionAmount: formatCurrency(payment.commision),
        totalAmount: formatCurrency(payment.totalAmount),
        checkoutUrl: typeof payment.checkoutUrl === 'string' ? payment.checkoutUrl.trim() : '',
      })),
    [dashboardData.pendingPayments],
  );

  const handlePayNow = async (payment) => {
    if (!user?.token) {
      toast.error('Please sign in to pay.');
      return;
    }
    const directUrl = payment.checkoutUrl;
    if (directUrl) {
      window.location.assign(directUrl);
      return;
    }
    if (!payment.requestId) {
      toast.error('Missing request for this payment.');
      return;
    }
    setPayingPaymentId(payment.paymentId || payment.requestId);
    try {
      const checkout = await startCheckoutApi({ requestId: payment.requestId, token: user.token });
      if (!checkout.checkoutUrl) {
        toast.error('Checkout URL was not returned. Open Payments to try again.');
        return;
      }
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      toast.error(error?.message || 'Failed to start checkout.');
    } finally {
      setPayingPaymentId('');
    }
  };

  const renderActivityTooltip = ({ active, label, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const uniqueValues = new Map();
    payload.forEach((entry) => {
      if ((entry.dataKey === 'created' || entry.dataKey === 'completed') && !uniqueValues.has(entry.dataKey)) {
        uniqueValues.set(entry.dataKey, entry.value);
      }
    });

    return (
      <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs shadow-md dark:border-violet-400/35 dark:bg-[#120a2e]/95">
        <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS.created }} />
              Created
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{uniqueValues.get('created') ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS.completed }} />
              Completed
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{uniqueValues.get('completed') ?? '-'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const item = payload[0]?.payload;
    if (!item) {
      return null;
    }

    return (
      <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs shadow-md dark:border-cyan-400/35 dark:bg-[#120a2e]/95">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
        <p className="mt-0.5 font-medium text-slate-600 dark:text-cyan-200">{item.value}%</p>
      </div>
    );
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="client">
      <div className="cd-dashboard-shell relative isolate space-y-3 sm:space-y-4">
        <div className="cd-page-orb-a pointer-events-none absolute -left-10 top-14 -z-10 h-44 w-44 rounded-full bg-violet-500/8 blur-3xl dark:bg-violet-500/20" />
        <div className="cd-page-orb-b pointer-events-none absolute -right-12 top-[23rem] -z-10 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl dark:bg-cyan-400/18" />
        <div className="cd-page-grid pointer-events-none absolute inset-0 -z-10 opacity-35" />
        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/10 dark:text-rose-200">
            {errorMessage}
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
            Loading dashboard data...
          </div>
        ) : null}

        <div className="cd-panel-glass cd-hero-prism relative min-h-[168px] overflow-hidden rounded-[1.12rem] border border-indigo-200/65 p-4 shadow-[0_12px_26px_rgba(79,70,229,0.09)] dark:border-cyan-400/32 dark:shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_14px_28px_rgba(8,2,32,0.62)] sm:min-h-[182px] sm:p-5">
          <div className="cd-hero-wave pointer-events-none absolute inset-0 opacity-85" />
          <div className="cd-hero-ribbon pointer-events-none absolute inset-0 opacity-75" />
          <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-cyan-400/14 blur-2xl dark:bg-cyan-400/12" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-violet-500/14 blur-2xl dark:bg-violet-500/12" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full border border-sky-300/45 bg-gradient-to-r from-sky-500/78 to-indigo-500/78 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm dark:border-cyan-300/35 dark:from-cyan-500/72 dark:to-violet-500/72">
                <Sparkles className="h-3 w-3" />
                Client Dashboard
              </p>
              <h1 className="mt-2 text-[1.5rem] font-black leading-[0.95] text-slate-900 dark:text-slate-100 sm:text-[2.55rem]">
                Welcome, <span className="bg-gradient-to-r from-slate-700 via-indigo-600 to-slate-700 bg-clip-text text-transparent dark:from-cyan-200 dark:via-violet-300 dark:to-sky-200">{clientName}</span>
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-[15px]">
                Your client workspace is ready with live updates and colorful insights.
              </p>
            </div>

            <div className="flex items-start sm:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/85 bg-white/82 px-2.5 py-1.5 dark:border-slate-600/75 dark:bg-slate-900/62">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/18 dark:text-indigo-200">
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-500/18 dark:text-cyan-200">
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/18 dark:text-violet-200">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={`cs-card-rise cd-fast-rise border ${item.borderTone} ${item.cardTone} shadow-sm`}
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`cd-icon-float flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${item.iconWrap}`}>
                      <Icon className={`h-[18px] w-[18px] ${item.iconTone}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-300">{item.title}</p>
                      <p className="mt-0.5 text-[1.4rem] font-black leading-none text-slate-900 dark:text-slate-100 sm:text-[2rem]">{item.value}</p>
                      <p className={`mt-1 text-xs font-semibold ${item.subtitleTone}`}>{item.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-3.5 xl:grid-cols-[1.58fr_1fr]">
          <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-slate-50/92 to-slate-100/60 shadow-sm dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#170936] dark:via-[#1a0d42] dark:to-[#12082e] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-[1.75rem] font-black leading-none text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">Request Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              {requestActivityData.length === 0 ? (
                <EmptyChartMessage message="No request activity data available." />
              ) : (
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={requestActivityData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="createdShadow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACTIVITY_COLORS.created} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={ACTIVITY_COLORS.created} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedShadow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACTIVITY_COLORS.completed} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={ACTIVITY_COLORS.completed} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" opacity={0.55} />
                  <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} width={26} />
                  <Tooltip content={renderActivityTooltip} />
                  <Area type="monotone" dataKey="created" stroke="none" fill="url(#createdShadow)" fillOpacity={1} />
                  <Area type="monotone" dataKey="completed" stroke="none" fill="url(#completedShadow)" fillOpacity={1} />
                  <Line type="monotone" dataKey="created" stroke={ACTIVITY_COLORS.created} strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 4 }}>
                    <LabelList dataKey="created" position="top" className="fill-violet-700 text-[10px] font-semibold" />
                  </Line>
                  <Line type="monotone" dataKey="completed" stroke={ACTIVITY_COLORS.completed} strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 4 }}>
                    <LabelList dataKey="completed" position="top" className="fill-cyan-700 text-[10px] font-semibold" />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-slate-50/92 to-slate-100/60 shadow-sm dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#170936] dark:via-[#1a0d42] dark:to-[#12082e] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-blue-700 via-cyan-600 to-indigo-600 bg-clip-text text-[1.75rem] font-black leading-none text-transparent dark:from-blue-300 dark:via-cyan-300 dark:to-indigo-300">Requests by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {categoryData.length === 0 ? (
                <EmptyChartMessage message="No category data available." />
              ) : (
              <>
              <div className="relative h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={renderCategoryTooltip} />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={2}
                      stroke="rgba(255,255,255,0.92)"
                      strokeWidth={3}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black leading-none text-slate-900 dark:text-slate-50">{formatNumber(totalCategoryRequests)}</p>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                {categoryData.map((item) => (
                  <span key={item.name} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name} ({item.value}%)
                  </span>
                ))}
              </div>
              </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3.5 xl:grid-cols-[1.55fr_1fr]">
          <Card className="cs-card-rise cd-fast-rise border-indigo-200/75 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/24 shadow-[0_14px_30px_rgba(79,70,229,0.12)] dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#160833] dark:via-[#1a0d40] dark:to-[#12082b] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 bg-clip-text text-[1.75rem] font-black leading-none text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-sky-300">Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-700/70">
                      <th className="px-0 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-300">Request</th>
                      <th className="px-0 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-300">Category</th>
                      <th className="px-0 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-300">Status</th>
                      <th className="px-0 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-300">Budget</th>
                      <th className="px-0 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-300">Deadline</th>
                      <th className="px-0 py-2.5 text-right text-xs font-bold text-slate-500 dark:text-slate-300"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request) => (
                      <tr key={request.requestId || request.title} className="border-b border-slate-200/70 last:border-b-0 dark:border-slate-700/70">
                        <td className="py-2.5 pr-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{request.title}</td>
                        <td className="py-2.5 pr-3 text-sm text-slate-600 dark:text-slate-300">{request.category}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusPillClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-sm font-bold text-slate-900 dark:text-slate-100">{request.budget}</td>
                        <td className="py-2.5 pr-3 text-sm text-slate-600 dark:text-slate-300">{request.date}</td>
                        <td className="py-2.5 text-right">
                          <Link to="/client/my-requests" className="text-sm font-semibold text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-200 dark:hover:text-sky-100">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && recentRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-5 text-center text-sm text-slate-500 dark:text-slate-300">
                          No recent requests.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2.5 lg:hidden">
                {recentRequests.map((request) => (
                  <div key={request.requestId || request.title} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-800/70">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{request.title}</h4>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusPillClass(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{request.category}</p>
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{request.budget}</span>
                      <span className="text-slate-600 dark:text-slate-300">{request.date}</span>
                      <Link to="/client/my-requests" className="font-semibold text-sky-600 dark:text-sky-200">View</Link>
                    </div>
                  </div>
                ))}
                {!isLoading && recentRequests.length === 0 ? (
                  <p className="py-3 text-center text-sm text-slate-500 dark:text-slate-300">No recent requests.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div>
            <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 shadow-sm dark:border-cyan-400/35 dark:bg-gradient-to-br dark:from-[#160833] dark:via-[#1a0d40] dark:to-[#12082b] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.2)]">
              <CardHeader className="pb-1">
                <CardTitle className="w-fit bg-gradient-to-r from-cyan-700 via-blue-600 to-violet-600 bg-clip-text text-xl font-black tracking-tight text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-violet-300">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    const actionTone = [
                      {
                        tile: 'border-slate-200/90 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-cyan-400/35 dark:bg-[#1a0d42] dark:hover:bg-[#231257]',
                        iconWrap: 'bg-slate-100 dark:bg-cyan-500/18',
                        icon: 'text-sky-700 dark:text-sky-200',
                      },
                      {
                        tile: 'border-slate-200/90 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-violet-400/35 dark:bg-[#1a0d42] dark:hover:bg-[#231257]',
                        iconWrap: 'bg-slate-100 dark:bg-violet-500/18',
                        icon: 'text-indigo-700 dark:text-indigo-200',
                      },
                      {
                        tile: 'border-slate-200/90 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-sky-400/35 dark:bg-[#1a0d42] dark:hover:bg-[#231257]',
                        iconWrap: 'bg-slate-100 dark:bg-sky-500/18',
                        icon: 'text-emerald-700 dark:text-emerald-200',
                      },
                      {
                        tile: 'border-slate-200/90 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-indigo-400/35 dark:bg-[#1a0d42] dark:hover:bg-[#231257]',
                        iconWrap: 'bg-slate-100 dark:bg-indigo-500/18',
                        icon: 'text-violet-700 dark:text-violet-200',
                      },
                    ][index % 4];

                    return (
                      <Button
                        key={action.title}
                        asChild
                        variant="outline"
                        className={`cd-action-tile h-auto min-h-[96px] rounded-xl border p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 ${actionTone.tile}`}
                      >
                        <Link to={action.path} className="flex h-full w-full flex-col items-center justify-center gap-2">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${actionTone.iconWrap}`}>
                            <Icon className={`h-[20px] w-[20px] ${actionTone.icon}`} />
                          </span>
                          <p className="text-[13px] font-bold leading-tight text-slate-800 dark:text-slate-100">{action.title}</p>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-violet-50/24 to-indigo-50/18 shadow-sm dark:border-cyan-400/35 dark:bg-gradient-to-br dark:from-[#160833] dark:via-[#1a0d40] dark:to-[#12082b] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.2)]">
          <CardHeader className="pb-1">
            <CardTitle className="w-fit bg-gradient-to-r from-fuchsia-700 via-violet-600 to-indigo-600 bg-clip-text text-xl font-black tracking-tight text-transparent dark:from-fuchsia-300 dark:via-violet-300 dark:to-indigo-300">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-200/85 dark:border-slate-700/70">
                    <th className="px-2 py-2.5 text-left text-xs font-bold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Invoice</th>
                    <th className="px-2 py-2.5 text-left text-xs font-bold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Request Title</th>
                    <th className="px-2 py-2.5 text-left text-xs font-bold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Amount</th>
                    <th className="px-2 py-2.5 text-left text-xs font-bold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Commission</th>
                    <th className="px-2 py-2.5 text-left text-xs font-bold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Total Amount</th>
                    <th className="px-2 py-2.5 text-right text-xs font-bold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment) => (
                    <tr key={payment.paymentId || payment.invoice} className="border-b border-slate-200/70 last:border-b-0 dark:border-slate-700/70">
                      <td className="px-2 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <div>{payment.invoice}</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-300">{payment.invoiceDate}</div>
                      </td>
                      <td className="px-2 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{payment.title}</td>
                      <td className="px-2 py-3 text-sm text-slate-700 dark:text-slate-200">{payment.amount}</td>
                      <td className="px-2 py-3 text-sm text-slate-700 dark:text-slate-200">{payment.commissionAmount}</td>
                      <td className="px-2 py-3 text-sm font-black text-slate-900 dark:text-slate-100">{payment.totalAmount}</td>
                      <td className="px-2 py-3 text-right">
                        <Button
                          type="button"
                          className="h-8 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-3.5 text-xs font-semibold text-white hover:from-sky-500 hover:to-violet-500"
                          disabled={Boolean(payingPaymentId)}
                          onClick={() => handlePayNow(payment)}
                        >
                          {payingPaymentId === (payment.paymentId || payment.requestId) ? 'Redirecting…' : 'Pay Now'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && pendingPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-5 text-center text-sm text-slate-500 dark:text-slate-300">
                        No pending payments.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="space-y-2.5 lg:hidden">
              {pendingPayments.map((payment) => (
                <div key={payment.paymentId || payment.invoice} className="rounded-xl border border-cyan-200/80 bg-white/80 p-3 shadow-sm dark:border-cyan-400/35 dark:bg-[#1a0d42]/90">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p className="font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Invoice</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">{payment.invoice}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">{payment.invoiceDate}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Request Title</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">{payment.title}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Amount</p>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{payment.amount}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Commission</p>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{payment.commissionAmount}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between border-t border-slate-200/80 pt-2 dark:border-slate-700/70">
                      <div>
                        <p className="font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-300">Total Amount</p>
                        <p className="mt-0.5 text-base font-black text-slate-900 dark:text-slate-100">{payment.totalAmount}</p>
                      </div>
                      <Button
                        type="button"
                        className="h-8 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-3.5 text-xs font-semibold text-white hover:from-sky-500 hover:to-violet-500"
                        disabled={Boolean(payingPaymentId)}
                        onClick={() => handlePayNow(payment)}
                      >
                        {payingPaymentId === (payment.paymentId || payment.requestId) ? 'Redirecting…' : 'Pay Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!isLoading && pendingPayments.length === 0 ? (
                <p className="py-3 text-center text-sm text-slate-500 dark:text-slate-300">No pending payments.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
