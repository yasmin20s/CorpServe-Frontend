import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  FileStack,
  TrendingUp,
  Wallet,
  Sparkles,
  Search,
  Bell,
  ChevronUp,
  BarChart3,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'My Proposals', path: '/vendor/my-proposals', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];

const earningsData = [
  { month: 'Nov', billed: 18000, received: 15000 },
  { month: 'Dec', billed: 22000, received: 20000 },
  { month: 'Jan', billed: 19000, received: 17000 },
  { month: 'Feb', billed: 28000, received: 25000 },
  { month: 'Mar', billed: 35000, received: 30000 },
  { month: 'Apr', billed: 42300, received: 38000 },
];

export default function VendorDashboard() {
  const activeContractsCount = 5;
  const openProposals = 8;
  const revenueThisMonth = 42300;
  const avgRating = 4.8;
  const ratingsCount = 27;
  const avgResponseHours = 4;

  const submittedProposals = 47;
  const acceptedProposals = 32;
  const rejectedProposals = 15;
  const proposalWinRate = Math.round((acceptedProposals / submittedProposals) * 100);

  const momentumData = earningsData.map((item, index) => ({
    month: item.month,
    billed: item.billed / 1000,
    received: item.received / 1000,
    target: (item.received * 0.92) / 1000 + (index % 2 === 0 ? 1 : -0.6),
  }));
  const latestEarnings = earningsData[earningsData.length - 1];
  const collectionRate = Math.round((latestEarnings.received / latestEarnings.billed) * 100);

  const activeContracts = [
    { label: 'ERP Integration', value: '75%', amount: 'TechCorp Egypt · Apr 30', status: 'in-progress', icon: Briefcase },
    { label: 'Fleet Management', value: '40%', amount: 'Nile Logistics · May 15', status: 'at-risk', icon: Activity },
    { label: 'Contract Audit', value: '60%', amount: 'Delta Legal Grp · May 5', status: 'in-progress', icon: FileText },
    { label: 'HR Consulting', value: '20%', amount: 'SkyBuild Co. · May 20', status: 'active', icon: CheckCircle },
  ];

  const statusPillClass = {
    'in-progress': 'bg-emerald-100 text-emerald-700',
    'at-risk': 'bg-amber-100 text-amber-700',
    active: 'bg-indigo-100 text-indigo-700',
  };

  const upcomingDeadlines = [
    { date: 'Apr 17', title: 'ERP Phase 1 Delivery', client: 'TechCorp', tone: 'bg-rose-500' },
    { date: 'Apr 22', title: 'Legal Draft Submission', client: 'Delta Legal', tone: 'bg-amber-500' },
    { date: 'Apr 30', title: 'Final ERP Handover', client: 'TechCorp', tone: 'bg-emerald-500' },
    { date: 'May 5', title: 'Audit Report', client: 'Delta Legal', tone: 'bg-sky-500' },
    { date: 'May 15', title: 'Fleet Report Q2', client: 'Nile Logistics', tone: 'bg-blue-500' },
  ];

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
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Active Contracts */}
          <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white">
                  <Briefcase className="h-6 w-6" />
                </span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">{activeContractsCount}</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Active Contracts</p>
              <p className="text-xs text-emerald-600 font-bold">↑ 1 this week</p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all bg-gradient-to-br from-pink-50 to-rose-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                  <Wallet className="h-6 w-6" />
                </span>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">42.3k</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Revenue This Month</p>
              <p className="text-xs text-emerald-600 font-bold">↑ 18%</p>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all bg-gradient-to-br from-blue-50 to-sky-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white">
                  <TrendingUp className="h-6 w-6" />
                </span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600">{avgRating}</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Avg Rating</p>
              <p className="text-xs text-slate-500">from 27 ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Add Open Proposals back to KPI */}
        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2 overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-purple-50 shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700">Earnings Over Time</h3>
                  <p className="text-xs text-slate-500">Billed vs received analysis</p>
                </div>
                <div className="inline-flex rounded-full bg-gradient-to-r from-purple-100 to-pink-100 p-1">
                  <button type="button" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white shadow-md">Monthly</button>
                  <button type="button" className="rounded-full px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all">Quarterly</button>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={momentumData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line type="monotone" dataKey="billed" stroke="#a855f7" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="received" stroke="#06b6d4" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-pink-50 shadow-lg">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-rose-600">Proposal Win Rate</h3>
                <p className="text-xs text-slate-500">Performance metric</p>
              </div>
              <div className="flex justify-center">
                <div
                  className="relative grid h-48 w-48 place-items-center rounded-full shadow-lg"
                  style={{
                    background: `conic-gradient(#a855f7 ${proposalWinRate}%, #f3e8ff ${proposalWinRate}% 100%)`,
                  }}
                >
                  <div className="grid h-40 w-40 place-items-center rounded-full bg-white shadow-inner">
                    <div className="text-center">
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{proposalWinRate}%</p>
                      <p className="text-xs font-semibold text-slate-600 mt-1">Win Rate</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-slate-800">{submittedProposals}</p>
                  <p className="text-xs font-semibold text-slate-500">Submitted</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{acceptedProposals}</p>
                  <p className="text-xs font-semibold text-slate-500">Accepted</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-rose-600">{rejectedProposals}</p>
                  <p className="text-xs font-semibold text-slate-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Contracts & Deadlines */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-indigo-50 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700 mb-5">Active Contracts</h3>
              <div className="space-y-3">
                {activeContracts.map((item, idx) => {
                  const Icon = item.icon;
                  const statusColors = {
                    'in-progress': 'bg-emerald-100 text-emerald-700 border-l-4 border-l-emerald-500',
                    'at-risk': 'bg-amber-100 text-amber-700 border-l-4 border-l-amber-500',
                    'active': 'bg-indigo-100 text-indigo-700 border-l-4 border-l-indigo-500',
                  };
                  return (
                    <div key={item.label} className={`flex items-center gap-3 p-4 rounded-xl ${statusColors[item.status]} hover:shadow-md transition-all`}>
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/50">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.label}</p>
                        <p className="text-xs opacity-75 truncate">{item.amount}</p>
                      </div>
                      <div className="text-right">
                        <div className="w-24 h-1 bg-white/40 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-white rounded-full" style={{ width: item.value }} />
                        </div>
                        <p className="text-sm font-bold">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-blue-50 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 mb-5">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div key={`${deadline.date}-${deadline.title}`} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:shadow-md transition-all border-l-4" style={{ borderColor: deadline.tone.replace('bg-', '') }}>
                    <span className={`mt-1 h-3 w-3 rounded-full ${deadline.tone} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{deadline.date}</p>
                      <p className="font-semibold text-slate-800 truncate">{deadline.title}</p>
                      <p className="text-xs text-slate-600 truncate">{deadline.client}</p>
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
