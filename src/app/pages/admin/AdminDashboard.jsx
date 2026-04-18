import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'motion/react';
import DarkVeil from '../../components/backgrounds/DarkVeil';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { AlertTriangle, Briefcase, Clock3, DollarSign, FileText, LayoutDashboard, TrendingUp, UserCheck, Users } from 'lucide-react';
import { Area, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

const statCards = [
  {
    title: 'Total Users',
    value: '1,248',
    trend: '+34 this week',
    trendTone: 'positive',
    icon: Users,
    iconTone: 'text-violet-600 dark:text-violet-200',
    iconWrap: 'bg-violet-100 dark:bg-violet-500/25',
    valueTone: 'text-slate-900 dark:text-slate-100',
    cardTone: 'border-violet-200/90 bg-gradient-to-br from-white to-violet-50/60 dark:border-violet-400/40 dark:from-[#20113f] dark:to-[#1a1236]',
  },
  {
    title: 'Active Requests',
    value: '187',
    trend: '+12 today',
    trendTone: 'positive',
    icon: FileText,
    iconTone: 'text-sky-600 dark:text-sky-200',
    iconWrap: 'bg-sky-100 dark:bg-sky-500/25',
    valueTone: 'text-slate-900 dark:text-slate-100',
    cardTone: 'border-sky-200/90 bg-gradient-to-br from-white to-sky-50/70 dark:border-sky-400/40 dark:from-[#131f3a] dark:to-[#122638]',
  },
  {
    title: 'Platform Revenue',
    value: '318,500 EGP',
    trend: '+22% MoM',
    trendTone: 'positive',
    icon: DollarSign,
    iconTone: 'text-fuchsia-600 dark:text-fuchsia-200',
    iconWrap: 'bg-fuchsia-100 dark:bg-fuchsia-500/25',
    valueTone: 'text-slate-900 dark:text-slate-100',
    cardTone: 'border-fuchsia-200/90 bg-gradient-to-br from-white to-fuchsia-50/70 dark:border-fuchsia-400/40 dark:from-[#271238] dark:to-[#211231]',
  },
  {
    title: 'SLA Breach Risk',
    value: '3',
    trend: 'needs attention',
    trendTone: 'danger',
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

const platformActivityData = [
    { day: '1', requests: 20, signups: 13, completed: 15 },
    { day: '2', requests: 23, signups: 13, completed: 16 },
    { day: '3', requests: 26, signups: 13, completed: 18 },
    { day: '4', requests: 28, signups: 12, completed: 19 },
    { day: '5', requests: 29, signups: 12, completed: 21 },
    { day: '6', requests: 30, signups: 11, completed: 22 },
    { day: '7', requests: 30, signups: 10, completed: 22 },
    { day: '8', requests: 29, signups: 9, completed: 23 },
    { day: '9', requests: 27, signups: 8, completed: 23 },
    { day: '10', requests: 24, signups: 7, completed: 24 },
    { day: '11', requests: 21, signups: 6, completed: 23 },
    { day: '12', requests: 19, signups: 6, completed: 23 },
    { day: '13', requests: 18, signups: 5, completed: 23 },
    { day: '14', requests: 18, signups: 6, completed: 22 },
    { day: '15', requests: 18, signups: 6, completed: 21 },
    { day: '16', requests: 18, signups: 7, completed: 20 },
    { day: '17', requests: 20, signups: 8, completed: 19 },
    { day: '18', requests: 22, signups: 9, completed: 19 },
    { day: '19', requests: 25, signups: 11, completed: 18 },
    { day: '20', requests: 28, signups: 12, completed: 17 },
    { day: '21', requests: 31, signups: 13, completed: 16 },
    { day: '22', requests: 34, signups: 15, completed: 16 },
    { day: '23', requests: 36, signups: 16, completed: 16 },
    { day: '24', requests: 37, signups: 17, completed: 16 },
    { day: '25', requests: 38, signups: 18, completed: 17 },
    { day: '26', requests: 37, signups: 18, completed: 17 },
    { day: '27', requests: 36, signups: 18, completed: 17 },
    { day: '28', requests: 34, signups: 18, completed: 18 },
    { day: '29', requests: 32, signups: 17, completed: 20 },
    { day: '30', requests: 30, signups: 17, completed: 21 },
];

const userDistributionData = [
  { name: 'Clients', value: 58, color: '#5d66eb' },
  { name: 'Vendors', value: 32, color: '#2d7fe6' },
  { name: 'Admins', value: 10, color: '#f59e0b' },
];

const serviceCategoriesData = [
  { name: 'IT Services', value: 34, color: '#5d66eb' },
  { name: 'Legal', value: 24, color: '#6f77ef' },
  { name: 'HR Services', value: 20, color: '#8289f2' },
  { name: 'Logistics', value: 16, color: '#959cf5' },
  { name: 'Financial', value: 6, color: '#aab0f8' },
];

const pendingVendorApprovals = [
    { initials: 'AM', name: 'Ahmed Mostafa', role: 'Web Dev', date: 'Apr 14', avatarTone: 'from-violet-500 to-indigo-500' },
    { initials: 'SK', name: 'Sara Khalil', role: 'Legal', date: 'Apr 13', avatarTone: 'from-fuchsia-500 to-violet-500' },
    { initials: 'ON', name: 'Omar Nasser', role: 'Logistics', date: 'Apr 12', avatarTone: 'from-cyan-500 to-sky-500' },
    { initials: 'MA', name: 'Mona Adel', role: 'HR', date: 'Apr 11', avatarTone: 'from-amber-400 to-orange-500' },
];

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

export default function AdminDashboard() {
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
        <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">Day {label}</p>
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
              <h1 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome{' '}
                <span className="bg-gradient-to-r from-[#b9a0ea] via-[#c995ea] to-[#7fdbef] bg-clip-text text-transparent">
                  Admin
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

        <motion.div variants={cardStagger} className="grid gap-4 xl:grid-cols-[1.7fr_1.25fr_1.25fr]" initial="hidden" animate="show">
          <motion.div variants={cardReveal}>
          <Card className="rounded-2xl border border-slate-200/85 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="w-fit bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-[1.95rem] font-black text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={platformActivityData} margin={{ top: 6, right: 5, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityRequestsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c83ea" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#7c83ea" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} minTickGap={10} />
                  <YAxis domain={[0, 40]} stroke="#94a3b8" tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={renderPlatformActivityTooltip} />
                  <Area type="monotone" dataKey="requests" fill="url(#activityRequestsFill)" stroke="none" legendType="none" />
                  <Line type="monotone" dataKey="requests" stroke={ACTIVITY_COLORS.requests} strokeWidth={2.5} dot={false} name="Requests" />
                  <Line type="monotone" dataKey="signups" stroke={ACTIVITY_COLORS.signups} strokeWidth={2.2} dot={false} name="Signups" />
                  <Line type="monotone" dataKey="completed" stroke={ACTIVITY_COLORS.completed} strokeWidth={2.2} dot={false} name="Completed" />
                </ComposedChart>
              </ResponsiveContainer>
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
                  <p className="text-[1.9rem] font-black leading-none text-slate-900 dark:text-slate-100">1,248</p>
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
              {serviceCategoriesData.map((item) => (
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
                  key={vendor.name}
                  className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${vendor.avatarTone} text-sm font-bold text-white shadow-sm`}>
                      {vendor.initials}
                    </span>
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
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>);
}
