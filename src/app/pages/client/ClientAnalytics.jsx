import { useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CircleDollarSign, MessageSquare, Sparkles, Star } from 'lucide-react';

const kpiCards = [
  {
    title: 'Total Requests',
    value: '42',
    delta: '+8 vs prev period',
    deltaColor: 'text-emerald-500 dark:text-emerald-300',
    sparkline: [6, 7, 8, 6, 9, 8, 10, 12],
    borderTone: 'border-slate-200/90 dark:border-cyan-400/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
  },
  {
    title: 'Avg Response Time',
    value: '1.4 days',
    delta: '-0.3 improvement',
    deltaColor: 'text-emerald-500 dark:text-emerald-300',
    sparkline: [8, 8, 8, 7, 6.5, 6, 6, 6],
    borderTone: 'border-slate-200/90 dark:border-violet-400/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
  },
  {
    title: 'Total Spent',
    value: '148,200 EGP',
    delta: '+23%',
    deltaColor: 'text-emerald-500 dark:text-emerald-300',
    sparkline: [5, 5.5, 6, 7, 6.8, 8.2, 9.1, 11],
    borderTone: 'border-slate-200/90 dark:border-sky-400/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
  },
  {
    title: 'Service Success Rate',
    value: '91%',
    delta: '+4%',
    deltaColor: 'text-emerald-500 dark:text-emerald-300',
    sparkline: [8, 8.1, 8.2, 8.4, 8.5, 8.7, 8.8, 8.9],
    borderTone: 'border-slate-200/90 dark:border-indigo-400/55',
    cardTone: 'bg-gradient-to-br from-white to-slate-50/92 dark:from-[#1a0d42] dark:to-[#170936]',
  },
];

const monthlySpendingData = [
  { month: 'Jan', value: 8000 },
  { month: 'Feb', value: 12000 },
  { month: 'Mar', value: 9000 },
  { month: 'Apr', value: 15000 },
  { month: 'May', value: 11000 },
  { month: 'Jun', value: 18000 },
  { month: 'Jul', value: 14000 },
  { month: 'Aug', value: 22000 },
  { month: 'Sep', value: 19000 },
  { month: 'Oct', value: 28000 },
  { month: 'Nov', value: 24000 },
  { month: 'Dec', value: 32000 },
];

const spendingByCategoryData = [
  { category: 'IT', value: 58000 },
  { category: 'Legal', value: 32000 },
  { category: 'HR', value: 24000 },
  { category: 'Logistics', value: 18000 },
  { category: 'Financial', value: 11000 },
  { category: 'Other', value: 5000 },
];

const requestStatusData = [
  { name: 'Completed', value: 54, color: '#22c55e' },
  { name: 'Active', value: 21, color: '#3b82f6' },
  { name: 'Pending', value: 16, color: '#f59e0b' },
];

const vendorResponseTimeData = [
  { range: '<1hr', value: 8 },
  { range: '1-4hr', value: 18 },
  { range: '4-12hr', value: 11 },
  { range: '12-24hr', value: 4 },
  { range: '>24hr', value: 1 },
];

const topVendors = [
  { name: 'TechVision LLC', services: 5, rating: 4.9, amount: '38,000 EGP' },
  { name: 'Nile Legal Grp', services: 3, rating: 4.7, amount: '24,500 EGP' },
  { name: 'Delta Consult', services: 4, rating: 4.5, amount: '19,200 EGP' },
  { name: 'SkyBuild Co.', services: 2, rating: 4.8, amount: '14,000 EGP' },
];

const rangeOptions = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

function Sparkline({ values }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="mt-2 h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke="#4ade80" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ClientAnalytics() {
  const [timeRange, setTimeRange] = useState('30days');
  const menuItems = useDashboardMenu('client');

  const requestStatusTotal = useMemo(
    () => requestStatusData.reduce((acc, item) => acc + item.value, 0),
    [],
  );

  return (
    <DashboardLayout menuItems={menuItems} userRole="client">
      <div className="cd-dashboard-shell relative isolate space-y-3 sm:space-y-4">
        <div className="cd-page-orb-a pointer-events-none absolute -left-10 top-14 -z-10 h-44 w-44 rounded-full bg-violet-500/8 blur-3xl dark:bg-violet-500/20" />
        <div className="cd-page-orb-b pointer-events-none absolute -right-12 top-[23rem] -z-10 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl dark:bg-cyan-400/18" />
        <div className="cd-page-grid pointer-events-none absolute inset-0 -z-10 opacity-35" />

        <div className="cd-panel-glass cd-hero-prism relative min-h-[168px] overflow-hidden rounded-[1.12rem] border border-indigo-200/65 p-4 shadow-[0_12px_26px_rgba(79,70,229,0.09)] dark:border-cyan-400/32 dark:shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_14px_28px_rgba(8,2,32,0.62)] sm:min-h-[182px] sm:p-5">
          <div className="cd-hero-wave pointer-events-none absolute inset-0 opacity-85" />
          <div className="cd-hero-ribbon pointer-events-none absolute inset-0 opacity-75" />
          <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-cyan-400/14 blur-2xl dark:bg-cyan-400/12" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-violet-500/14 blur-2xl dark:bg-violet-500/12" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full border border-sky-300/45 bg-gradient-to-r from-sky-500/78 to-indigo-500/78 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm dark:border-cyan-300/35 dark:from-cyan-500/72 dark:to-violet-500/72">
                <Sparkles className="h-3 w-3" />
                Client Analytics
              </p>
              <h1 className="mt-2 bg-gradient-to-r from-slate-800 via-indigo-600 to-slate-800 bg-clip-text text-[2.1rem] font-black leading-[0.95] text-transparent dark:from-cyan-200 dark:via-violet-300 dark:to-sky-200 sm:text-[2.45rem]">
                Performance & Spend Insights
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-[15px]">
                Same analytics data, now aligned with the client dashboard visual language.
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

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeRange(option.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                timeRange === option.value
                  ? 'bg-gradient-to-r from-sky-500 to-violet-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, index) => (
            <Card
              key={card.title}
              className={`cs-card-rise cd-fast-rise border ${card.borderTone} ${card.cardTone} shadow-sm`}
              style={{ animationDelay: `${80 + index * 70}ms` }}
            >
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-300">{card.title}</p>
                <p className="mt-1 text-[2rem] font-black leading-none text-slate-900 dark:text-slate-100">{card.value}</p>
                <p className={`mt-1 text-xs font-semibold ${card.deltaColor}`}>{card.delta}</p>
                <Sparkline values={card.sparkline} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-3.5 xl:grid-cols-[1.58fr_1fr]">
          <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-slate-50/92 to-slate-100/60 shadow-sm dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#170936] dark:via-[#1a0d42] dark:to-[#12082e] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-[1.75rem] font-black leading-none text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">Monthly Spending Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v) => `${Number(v).toLocaleString()} EGP`}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(2,6,23,0.2)',
                      color: 'var(--card-foreground)',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#7f5cff" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-slate-50/92 to-slate-100/60 shadow-sm dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#170936] dark:via-[#1a0d42] dark:to-[#12082e] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-blue-700 via-cyan-600 to-indigo-600 bg-clip-text text-[1.75rem] font-black leading-none text-transparent dark:from-blue-300 dark:via-cyan-300 dark:to-indigo-300">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={spendingByCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="category" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip formatter={(v) => `${Number(v).toLocaleString()} EGP`} />
                  <Bar dataKey="value" fill="#6d3fd8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3.5 xl:grid-cols-3">
          <Card className="cs-card-rise cd-fast-rise border-indigo-200/75 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/24 shadow-[0_14px_30px_rgba(79,70,229,0.12)] dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#160833] dark:via-[#1a0d40] dark:to-[#12082b] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 bg-clip-text text-[1.75rem] font-black leading-none text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-sky-300">Request Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestStatusData}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={92}
                      startAngle={0}
                      endAngle={360}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {requestStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="-mt-32 flex flex-col items-center justify-center pb-14">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{requestStatusTotal}</span>
                <span className="text-sm text-slate-500 dark:text-slate-300">Total</span>
              </div>
              <div className="space-y-2">
                {requestStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-100">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 shadow-sm dark:border-cyan-400/35 dark:bg-gradient-to-br dark:from-[#160833] dark:via-[#1a0d40] dark:to-[#12082b] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-cyan-700 via-blue-600 to-violet-600 bg-clip-text text-xl font-black tracking-tight text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-violet-300">Vendor Response Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vendorResponseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="range" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="value" fill="#6d72de" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="cs-card-rise cd-fast-rise border-slate-200/80 bg-gradient-to-br from-white via-violet-50/24 to-indigo-50/18 shadow-sm dark:border-cyan-400/35 dark:bg-gradient-to-br dark:from-[#160833] dark:via-[#1a0d40] dark:to-[#12082b] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.2)]">
            <CardHeader className="pb-1">
              <CardTitle className="w-fit bg-gradient-to-r from-fuchsia-700 via-violet-600 to-indigo-600 bg-clip-text text-xl font-black tracking-tight text-transparent dark:from-fuchsia-300 dark:via-violet-300 dark:to-indigo-300">Top Vendors Used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {topVendors.map((vendor, index) => (
                <div key={vendor.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-sky-500 to-violet-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100">{vendor.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                        <span>{vendor.services} services</span>
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {vendor.rating}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">{vendor.amount}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
