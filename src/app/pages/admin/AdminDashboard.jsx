import DashboardLayout from '../../components/DashboardLayout';
import EmptyChartMessage from '../../components/EmptyChartMessage';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import DarkVeil from '../../components/backgrounds/DarkVeil';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { AlertTriangle, Briefcase, Clock3, DollarSign, FileText, LayoutDashboard, TrendingUp, UserCheck, Users } from 'lucide-react';
import { Area, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { getAdminDashboardApi } from '../../services/dashboardApi';

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

const statCardStyles = [
  {
    title: 'Total Users',
    key: 'totalUsers',
    icon: Users,
    iconTone: 'text-violet-600 dark:text-violet-200',
    iconWrap: 'bg-violet-100 dark:bg-violet-500/25',
    valueTone: 'text-slate-900 dark:text-slate-100',
    cardTone: 'border-violet-200/90 bg-gradient-to-br from-white to-violet-50/60 dark:border-violet-400/40 dark:from-[#20113f] dark:to-[#1a1236]',
  },
  {
    title: 'Active Requests',
    key: 'activeRequests',
    icon: FileText,
    iconTone: 'text-sky-600 dark:text-sky-200',
    iconWrap: 'bg-sky-100 dark:bg-sky-500/25',
    valueTone: 'text-slate-900 dark:text-slate-100',
    cardTone: 'border-sky-200/90 bg-gradient-to-br from-white to-sky-50/70 dark:border-sky-400/40 dark:from-[#131f3a] dark:to-[#122638]',
  },
  {
    title: 'Platform Revenue',
    key: 'platformRevenue',
    icon: DollarSign,
    iconTone: 'text-fuchsia-600 dark:text-fuchsia-200',
    iconWrap: 'bg-fuchsia-100 dark:bg-fuchsia-500/25',
    valueTone: 'text-slate-900 dark:text-slate-100',
    cardTone: 'border-fuchsia-200/90 bg-gradient-to-br from-white to-fuchsia-50/70 dark:border-fuchsia-400/40 dark:from-[#271238] dark:to-[#211231]',
  },
  {
    title: 'SLA Breach Risk',
    key: 'slaBreachRisk',
    icon: AlertTriangle,
    iconTone: 'text-orange-600 dark:text-orange-300',
    iconWrap: 'bg-orange-100 dark:bg-orange-500/20',
    valueTone: 'text-rose-500 dark:text-rose-300',
    cardTone: 'border-rose-200/90 bg-gradient-to-br from-white to-rose-50/65 dark:border-rose-400/40 dark:from-[#2a1025] dark:to-[#24101f]',
  },
];

const adminHeroTiles = [
  {
    label: 'Users Overview',
    icon: Users,
    iconWrap: 'border-cyan-200/45 bg-gradient-to-br from-cyan-300/35 to-cyan-200/12 text-cyan-100',
  },
  {
    label: 'Request Monitor',
    icon: FileText,
    iconWrap: 'border-blue-200/45 bg-gradient-to-br from-blue-300/35 to-blue-200/12 text-blue-100',
  },
  {
    label: 'Revenue Watch',
    icon: DollarSign,
    iconWrap: 'border-fuchsia-200/45 bg-gradient-to-br from-fuchsia-300/35 to-fuchsia-200/12 text-fuchsia-100',
  },
  {
    label: 'Approval Queue',
    icon: Clock3,
    iconWrap: 'border-amber-200/45 bg-gradient-to-br from-amber-300/35 to-amber-200/12 text-amber-100',
  },
  {
    label: 'SLA Watch',
    icon: AlertTriangle,
    iconWrap: 'border-rose-200/45 bg-gradient-to-br from-rose-300/35 to-rose-200/12 text-rose-100',
  },
  {
    label: 'Growth Insights',
    icon: TrendingUp,
    iconWrap: 'border-emerald-200/45 bg-gradient-to-br from-emerald-300/35 to-emerald-200/12 text-emerald-100',
  },
];

const ACTIVITY_COLORS = {
  requests: '#6f76de',
  signups: '#3b82f6',
  completed: '#22c55e',
};

const USER_DISTRIBUTION_COLORS = ['#5d66eb', '#2d7fe6', '#f59e0b'];
const SERVICE_CATEGORY_COLORS = ['#5d66eb', '#6f77ef', '#8289f2', '#959cf5', '#aab0f8'];
const VENDOR_AVATAR_TONES = [
  'from-violet-500 to-indigo-500',
  'from-fuchsia-500 to-violet-500',
  'from-cyan-500 to-sky-500',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-500',
];
const EMPTY_DASHBOARD_DATA = {
  adminQuickStats: {
    totalUsers: 0,
    totalUsersChangeThisWeek: 0,
    totalActiveRequests: 0,
    totalActiveRequestsChangeToday: 0,
    platformRevenue: 0,
    revenueMoMPercent: 0,
    slaBreachRiskCount: 0,
    slaBreachNeedAttention: false,
  },
  platformActivities: [],
  userDistributions: [],
  serviceCategories: [],
  pendingVendorApprovals: [],
};

const pageStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.44,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function trendTextClass(tone) {
    if (tone === 'danger') {
        return 'text-rose-500 dark:text-rose-300';
    }

    if (tone === 'warning') {
        return 'text-amber-500 dark:text-amber-300';
    }

    return 'text-emerald-500 dark:text-emerald-300';
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

function getInitials(name) {
  const text = String(name || '').trim();
  if (!text) return '--';
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0].toUpperCase()).join('');
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await getAdminDashboardApi({ token: user?.token });
        if (!cancelled) {
          setDashboardData({
            ...EMPTY_DASHBOARD_DATA,
            ...response,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardData(EMPTY_DASHBOARD_DATA);
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

  const quickStats = dashboardData.adminQuickStats ?? EMPTY_DASHBOARD_DATA.adminQuickStats;
  const platformActivityData = useMemo(
    () =>
      (dashboardData.platformActivities ?? []).map((item) => ({
        ...item,
        xLabel: item.monthLabel || item.day || '',
      })),
    [dashboardData.platformActivities],
  );
  const userDistributionData = useMemo(() => {
    const distribution = dashboardData.userDistributions?.[0];
    return [
      { name: 'Clients', value: Number(distribution?.clientsPercent ?? 0), color: USER_DISTRIBUTION_COLORS[0] },
      { name: 'Vendors', value: Number(distribution?.vendorsPercent ?? 0), color: USER_DISTRIBUTION_COLORS[1] },
      { name: 'Admins', value: Number(distribution?.adminsPercent ?? 0), color: USER_DISTRIBUTION_COLORS[2] },
    ];
  }, [dashboardData.userDistributions]);
  const serviceCategoriesData = useMemo(
    () =>
      (dashboardData.serviceCategories ?? []).map((item, index) => ({
        name: item.categoryName,
        value: Number(item.percent ?? 0),
        color: SERVICE_CATEGORY_COLORS[index % SERVICE_CATEGORY_COLORS.length],
      })),
    [dashboardData.serviceCategories],
  );
  const pendingVendorApprovals = useMemo(
    () =>
      (dashboardData.pendingVendorApprovals ?? []).map((vendor, index) => ({
        vendorId: vendor.vendorId,
        name: vendor.vendorName,
        role: vendor.categoryName,
        date: formatDateMMMDay(vendor.submittedAt),
        avatarTone: VENDOR_AVATAR_TONES[index % VENDOR_AVATAR_TONES.length],
        initials: getInitials(vendor.vendorName),
        profilePicUrl: vendor.profilePicUrl,
      })),
    [dashboardData.pendingVendorApprovals],
  );
  const statCards = useMemo(
    () => [
      {
        ...statCardStyles[0],
        value: formatNumber(quickStats.totalUsers),
        trend: `${formatSigned(quickStats.totalUsersChangeThisWeek)} this week`,
        trendTone: 'positive',
      },
      {
        ...statCardStyles[1],
        value: formatNumber(quickStats.totalActiveRequests),
        trend: `${formatSigned(quickStats.totalActiveRequestsChangeToday)} today`,
        trendTone: 'positive',
      },
      {
        ...statCardStyles[2],
        value: formatCurrency(quickStats.platformRevenue),
        trend: `${formatSigned(quickStats.revenueMoMPercent)}% MoM`,
        trendTone: quickStats.revenueMoMPercent < 0 ? 'warning' : 'positive',
      },
      {
        ...statCardStyles[3],
        value: formatNumber(quickStats.slaBreachRiskCount),
        trend: quickStats.slaBreachNeedAttention ? 'needs attention' : 'all clear',
        trendTone: quickStats.slaBreachNeedAttention ? 'danger' : 'positive',
      },
    ],
    [quickStats],
  );
  const displayName = user?.fullName?.trim() || 'Admin';

  const renderPlatformActivityTooltip = ({ active, label, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const uniqueValues = new Map();
    payload.forEach((entry) => {
      if (!uniqueValues.has(entry.dataKey)) {
        uniqueValues.set(entry.dataKey, entry.value);
      }
    });

    const rows = [
      { key: 'requests', label: 'Requests' },
      { key: 'signups', label: 'Signups' },
      { key: 'completed', label: 'Completed' },
    ];

    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900/95">
        <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">{label}</p>
        <div className="space-y-1">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS[row.key] }} />
                {row.label}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{uniqueValues.get(row.key) ?? '-'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUserDistributionTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const entry = payload[0]?.payload;
    if (!entry) {
      return null;
    }

    return (
      <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900/95">
        <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">User Segment</p>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.value}%</span>
        </div>
      </div>
    );
  };

  return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <motion.div
        className="space-y-4 rounded-3xl bg-[#eef1fb] p-2.5 dark:bg-slate-950/35 sm:p-3"
        initial="hidden"
        animate="show"
        variants={pageStagger}
      >
        <motion.section variants={sectionReveal} className="relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-800 via-indigo-700 to-blue-700 p-4 pb-2 text-white sm:p-6 sm:pb-4 lg:min-h-[286px] lg:p-8 lg:pb-4">
          <div className="pointer-events-none absolute inset-0">
            <DarkVeil hueShift={0} noiseIntensity={0} scanlineIntensity={0} speed={5.2} scanlineFrequency={0} warpAmount={0} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-900/55 via-indigo-900/50 to-blue-900/55" />
          <motion.div
            className="pointer-events-none absolute -left-20 top-6 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, 14, 0], scale: [1, 1.07, 1] }}
            transition={{ duration: 7.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
            animate={{ x: [0, -22, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 8.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-4">
              <Badge className="w-fit gap-1.5 border border-violet-200/40 bg-violet-200/10 text-violet-100">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Admin Dashboard
              </Badge>
              <h1 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Welcome{' '}
                <span className="bg-gradient-to-r from-[#b9a0ea] via-[#c995ea] to-[#7fdbef] bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-200 sm:text-base">
                Manage users, monitor platform activity, and respond quickly to approvals and SLA risks from one control panel.
              </p>
            </motion.div>
            <motion.div className="relative mt-4 flex justify-center lg:mt-6 lg:justify-end" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="mx-auto grid max-w-[680px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5">
                {adminHeroTiles.map((tile, index) => {
                  const Icon = tile.icon;
                  return (
                    <motion.div
                      key={tile.label}
                      className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-violet-200/40 bg-white/5 px-3 py-2 text-xs text-slate-100 backdrop-blur sm:text-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.1 }}
                    >
                      <motion.span
                        animate={{ scale: [1, 1.16, 1], rotate: [0, 6, 0] }}
                        transition={{ duration: 2 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        className={`inline-flex h-7 w-7 items-center justify-center border [clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)] ${tile.iconWrap}`}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.span>
                      {tile.label}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {errorMessage ? (
          <motion.div variants={sectionReveal} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/30 dark:text-rose-200">
            {errorMessage}
          </motion.div>
        ) : null}

        {isLoading ? (
          <motion.div variants={sectionReveal} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900 dark:text-slate-300">
            Loading dashboard data...
          </motion.div>
        ) : null}

        <motion.section variants={sectionReveal} className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" initial="hidden" animate="show">
          {statCards.map((item) => {
              const Icon = item.icon;

              return (
                <motion.div key={item.title} variants={cardReveal} whileHover={{ y: -2 }}>
                  <Card className={`rounded-xl border-2 shadow-sm ${item.cardTone}`}>
                    <CardContent className="p-3 sm:p-3.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{item.title}</p>
                      <p className={`mt-1 text-[1.85rem] font-black leading-none ${item.valueTone}`}>{item.value}</p>
                      <p className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold ${trendTextClass(item.trendTone)}`}>
                        {item.trendTone === 'positive' ? <span aria-hidden>↗</span> : null}
                        {item.trend}
                      </p>
                    </div>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.iconWrap}`}>
                      <Icon className={`h-[15px] w-[15px] ${item.iconTone}`} />
                    </span>
                  </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </motion.section>

        <motion.div variants={cardStagger} className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.7fr_1.25fr_1.25fr]" initial="hidden" animate="show">
          <motion.div variants={cardReveal}>
          <Card className="rounded-2xl border border-slate-200/85 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="w-fit bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-[1.95rem] font-black text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {platformActivityData.length === 0 ? (
                <EmptyChartMessage message="No platform activity data available." />
              ) : (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={platformActivityData} margin={{ top: 6, right: 5, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityRequestsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c83ea" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#7c83ea" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="xLabel" stroke="#94a3b8" tickLine={false} axisLine={false} minTickGap={10} />
                  <YAxis domain={[0, 40]} stroke="#94a3b8" tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={renderPlatformActivityTooltip} />
                  <Area type="monotone" dataKey="requests" fill="url(#activityRequestsFill)" stroke="none" legendType="none" />
                  <Line type="monotone" dataKey="requests" stroke={ACTIVITY_COLORS.requests} strokeWidth={2.5} dot={false} name="Requests" />
                  <Line type="monotone" dataKey="signups" stroke={ACTIVITY_COLORS.signups} strokeWidth={2.2} dot={false} name="Signups" />
                  <Line type="monotone" dataKey="completed" stroke={ACTIVITY_COLORS.completed} strokeWidth={2.2} dot={false} name="Completed" />
                </ComposedChart>
              </ResponsiveContainer>
              )}
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6f76de]" />Requests</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" />Signups</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Completed</span>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={cardReveal}>
          <Card className="rounded-2xl border border-slate-200/85 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-blue-700 via-cyan-600 to-indigo-600 bg-clip-text text-[1.7rem] font-black text-transparent dark:from-blue-300 dark:via-cyan-300 dark:to-indigo-300">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto h-[210px] max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={1.8}
                      stroke="#f8fafc"
                      strokeWidth={3}
                    >
                      {userDistributionData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={renderUserDistributionTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-[1.9rem] font-black leading-none text-slate-900 dark:text-slate-100">{formatNumber(quickStats.totalUsers)}</p>
                  <p className="mt-1 text-base text-slate-500 dark:text-slate-300">Users</p>
                </div>
              </div>

              <div className="mt-2 space-y-2 text-[1rem]">
                {userDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={cardReveal}>
          <Card className="rounded-2xl border border-slate-200/85 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 bg-clip-text text-[1.7rem] font-black text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-sky-300">Service Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-2">
              {serviceCategoriesData.length === 0 ? (
                <EmptyChartMessage message="No service category data available." />
              ) : serviceCategoriesData.map((item) => (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between text-base text-slate-600 dark:text-slate-300">
                    <span>{item.name}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color, width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>

        <motion.div variants={sectionReveal}>
        <Card className="rounded-2xl border border-slate-200/85 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900">
          <CardHeader className="pb-1">
            <CardTitle className="w-fit bg-gradient-to-r from-fuchsia-700 via-violet-600 to-indigo-600 bg-clip-text text-[1.95rem] font-black text-transparent dark:from-fuchsia-300 dark:via-violet-300 dark:to-indigo-300">Pending Vendor Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-200/80 dark:divide-slate-700/70">
              {pendingVendorApprovals.map((vendor) => (
                <motion.div
                  key={vendor.vendorId || vendor.name}
                  className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2.5">
                    {vendor.profilePicUrl ? (
                      <img
                        src={vendor.profilePicUrl}
                        alt={vendor.name}
                        className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${vendor.avatarTone} text-sm font-bold text-white shadow-sm`}>
                        {vendor.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{vendor.role} - {vendor.date}</p>
                    </div>
                  </div>
                  <Link to="/admin/vendor-approvals" className="inline-flex h-9 items-center justify-center rounded-full border border-violet-300 bg-white px-4 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50 dark:border-violet-400/45 dark:bg-slate-900 dark:text-violet-200 dark:hover:bg-slate-800">
                    Go to Vendor Approvals
                  </Link>
                </motion.div>
              ))}
              {!isLoading && pendingVendorApprovals.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">No pending vendor approvals.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>);
}
