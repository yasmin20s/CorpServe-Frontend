import React, { useEffect, useMemo, useState } from 'react';
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
  Star,
  Plus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import AnalyticsRangeDialog from '../../components/AnalyticsRangeDialog';
import { getVendorAnalyticsApi } from '../../services/analyticsApi';

const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'My Proposals', path: '/vendor/my-proposals', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];

export default function VendorAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30days');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ startDateUtc: null, endDateUtc: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isRangeSubmitting, setIsRangeSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState({
    overview: {},
    acceptedProposalsTrend: [],
    clientRetention: {},
    ratingsDistribution: { starsBreakdown: [] },
    topPerformingContracts: [],
  });

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const payload = await getVendorAnalyticsApi({
          token: user.token,
          rangeKey: timeRange,
          startDateUtc: timeRange === 'custom' ? customRange.startDateUtc : undefined,
          endDateUtc: timeRange === 'custom' ? customRange.endDateUtc : undefined,
        });
        if (!cancelled) setAnalytics(payload);
      } catch (error) {
        if (!cancelled) toast.error(error?.message || 'Failed to load vendor analytics.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (timeRange === 'custom' && (!customRange.startDateUtc || !customRange.endDateUtc)) return;
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.token, timeRange, customRange.startDateUtc, customRange.endDateUtc]);

  const handleRangeClick = (value) => {
    if (value === 'custom') {
      setIsCustomOpen(true);
      return;
    }
    setTimeRange(value);
  };

  const handleApplyCustomRange = async ({ startDateUtc, endDateUtc }) => {
    setIsRangeSubmitting(true);
    setCustomRange({ startDateUtc, endDateUtc });
    setTimeRange('custom');
    setIsCustomOpen(false);
    setIsRangeSubmitting(false);
  };

  const acceptedProposalsData = useMemo(
    () => (analytics.acceptedProposalsTrend || []).map((item) => ({
      month: item.label,
      accepted: Number(item.acceptedCount || 0),
    })),
    [analytics.acceptedProposalsTrend],
  );
  const repeatClientsData = useMemo(() => {
    const repeat = Number(analytics?.clientRetention?.repeatClientsPercent || 0);
    return [
      { name: 'Repeat', value: repeat, color: '#a855f7' },
      { name: 'New', value: Math.max(0, 100 - repeat), color: '#e2e8f0' },
    ];
  }, [analytics?.clientRetention?.repeatClientsPercent]);
  const ratingDistribution = useMemo(
    () => (analytics?.ratingsDistribution?.starsBreakdown || []).map((row) => ({
      stars: Number(row.stars || 0),
      count: Number(row.count || 0),
    })),
    [analytics?.ratingsDistribution?.starsBreakdown],
  );
  const topContracts = useMemo(
    () => (analytics.topPerformingContracts || []).map((row) => ({
      client: row.clientName,
      service: row.service,
      value: Number(row.valueEGP || 0),
      delivered: row.deliveredAtUtc ? new Date(row.deliveredAtUtc).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-',
      days: row.deliveryStatus,
      rating: Number(row.rating || 0),
    })),
    [analytics.topPerformingContracts],
  );
  
  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 text-slate-900 font-sans relative overflow-hidden dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100">

        <style>{`
          .hero-blob { animation: float 5s ease-in-out infinite; transform-origin: center; will-change: transform; }
          .hero-blob-2 { animation-delay: 1.6s; animation-duration: 7s; }
          @keyframes float { 0% { transform: translateY(0px) } 50% { transform: translateY(-24px) } 100% { transform: translateY(0px) } }

          .dot-grid { background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 18px 18px; opacity: .12; }

          .shine { animation: shimmer 3.2s linear infinite; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; }
          @keyframes shimmer { 0% { background-position: -120% 0 } 100% { background-position: 120% 0 } }

          .cta-pulse { animation: pulse 2.6s infinite; }
          @keyframes pulse { 0% { box-shadow: 0 6px 24px rgba(99,102,241,0.14); transform: translateY(0) scale(1); } 50% { box-shadow: 0 26px 48px rgba(99,102,241,0.16); transform: translateY(-3px) scale(1.03); } 100% { box-shadow: 0 6px 24px rgba(99,102,241,0.14); transform: translateY(0) scale(1); } }

          .fade-in-up { animation: fadeInUp .6s ease both; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>
        
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-25">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-[120px] dark:bg-blue-950/35"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-[120px] dark:bg-fuchsia-950/30"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/70 to-transparent dark:from-slate-950/75"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-8 p-8">
          
          {/* Hero / Header Section (match site style) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-pink-700 to-blue-700 p-10 text-white shadow-2xl hover:shadow-3xl transition-shadow duration-500 dark:from-[#040b1b] dark:via-[#091628] dark:to-[#061a2d]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/50 via-pink-300/30 to-blue-300/40 shine dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-cyan-500/10" />
              <div className="absolute inset-0 dot-grid dark:opacity-[0.08]" style={{ color: 'rgba(255,255,255,0.12)' }} />
            </div>
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-white/12 blur-3xl hero-blob" style={{ animation: 'float 5s ease-in-out infinite', willChange: 'transform' }} />
            <div className="absolute left-0 top-0 -ml-12 -mt-12 h-56 w-56 rounded-full bg-purple-400/20 blur-3xl hero-blob hero-blob-2" style={{ animation: 'float 7s ease-in-out 1.6s infinite', willChange: 'transform' }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-5xl sm:text-6xl font-black leading-tight fade-in-up">Vendor Analytics</h2>
                  <p className="mt-3 text-lg text-white/95 max-w-2xl fade-in-up" style={{ animationDelay: '80ms' }}>Accurate analytics to measure proposal performance, track returning clients, and uncover growth opportunities.</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="px-5 py-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:opacity-95 cta-pulse">Explore Insights</button>
                </div>
              </div>

              <div className="flex-none w-44 h-44 md:w-48 md:h-48 rounded-xl flex items-center justify-center">
                <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="4" y="4" width="132" height="132" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <g transform="translate(18,18)">
                    <rect x="0" y="52" width="104" height="10" rx="5" fill="rgba(255,255,255,0.06)" />
                    <rect x="0" y="34" width="80" height="10" rx="5" fill="#fff" opacity="0.12" />
                    <rect x="0" y="16" width="56" height="10" rx="5" fill="#fff" opacity="0.18" />
                    <circle cx="92" cy="30" r="8" fill="#fff" opacity="0.2" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-3 justify-center flex-wrap">
            {['7days', '30days', '90days', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => handleRangeClick(range)}
                className={`px-3 py-1 rounded-full font-semibold text-xs transition-all ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-200/30'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-purple-300'
                }`}
              >
                {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : range === '90days' ? 'Last 90 Days' : 'Custom Range'}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-300">
              Loading analytics...
            </div>
          ) : null}

          {/* Main Card */}
          <div className="relative bg-white border border-purple-200/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow dark:bg-slate-900 dark:border-purple-400/35">
            
            <div className="absolute inset-0 z-0 opacity-30">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                <ellipse cx="500" cy="250" rx="450" ry="180" fill="none" stroke="#818cf8" strokeWidth="0.5" opacity="0.2"/>
                <ellipse cx="500" cy="250" rx="350" ry="140" fill="none" stroke="#818cf8" strokeWidth="0.5" opacity="0.3"/>
                <ellipse cx="500" cy="250" rx="250" ry="100" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.25"/>
              </svg>
            </div>

            <div className="relative z-10 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rating Circle */}
                <div className="flex flex-col items-center justify-center lg:border-r border-slate-200 lg:pr-6 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-wider self-start mb-6 dark:text-slate-300">Performance Radar</span>
                  <div className="relative w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={repeatClientsData} innerRadius={48} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none" startAngle={90} endAngle={450}>
                          <Cell fill="#6366f1" />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        {Number(analytics?.overview?.avgRating || 0).toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wider mt-1">Avg Rating</span>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                  <div className="flex flex-col justify-center gap-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-700 uppercase dark:text-slate-300">Rating Distribution</span>
                    <span className="text-sm font-semibold text-slate-600 bg-purple-100 px-3 py-1 rounded-full dark:bg-violet-500/18 dark:text-slate-200">
                      {Number(analytics?.ratingsDistribution?.totalRatingsCount || 0)} Ratings
                    </span>
                  </div>
                  {ratingDistribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700 w-4">{item.stars}★</span>
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${(item.count / Math.max(1, Number(analytics?.ratingsDistribution?.totalRatingsCount || 0))) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-600 w-5 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 mt-6 pt-4 border-t border-slate-200 gap-6 dark:border-slate-700">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide dark:text-slate-300">Proposals Sent</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-2">
                    {Number(analytics?.overview?.proposalsSent || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Win Rate</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">
                      {Number(analytics?.overview?.winRatePercent || 0).toFixed(1)}%
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      {Number(analytics?.overview?.winRateChangePercent || 0) >= 0 ? '↑' : ''}{Number(analytics?.overview?.winRateChangePercent || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Avg Value</p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 mt-2">
                    {Number(analytics?.overview?.avgContractValueEGP || 0).toLocaleString()} EGP
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">On-Time</p>
                  <p className="text-3xl font-black text-emerald-600 mt-2">
                    {Number(analytics?.overview?.onTimeDeliveryPercent || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Small Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Repeat Rate */}
            <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200/80 rounded-2xl p-6 shadow-lg transition-shadow dark:from-[#1a1038] dark:to-[#13233e] dark:border-purple-400/35 dark:bg-slate-900">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-6">Repeat Rate Index</h3>
              <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={repeatClientsData} innerRadius={38} outerRadius={50} dataKey="value" stroke="none">
                        <Cell fill="#6366f1" />
                        <Cell fill="#d1d5db" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">
                    {Number(analytics?.clientRetention?.repeatClientsPercent || 0).toFixed(0)}%
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-6 font-semibold text-center">
                  Total clients served: <span className="text-purple-700 font-bold">{Number(analytics?.clientRetention?.totalClientsServed || 0)}</span>
                </p>
              </div>
            </div>

            {/* Bar Monthly */}
            <div className="bg-gradient-to-br from-white to-pink-50 border border-pink-200/80 rounded-2xl p-6 shadow-lg transition-shadow dark:from-[#1a0720] dark:to-[#1a0728] dark:border-slate-700 dark:bg-slate-900">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Accepted Proposals</h3>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acceptedProposalsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="accepted" radius={[6, 6, 0, 0]}>
                      {acceptedProposalsData.map((_, i) => (
                        <Cell key={i} fill={i === 5 ? '#a78bfa' : (i === 4 ? '#818cf8' : '#6366f1')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Contracts Table */}
          <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50 shadow-lg dark:from-[#071026] dark:to-[#07142a] dark:border-slate-700 dark:bg-slate-900">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide dark:text-slate-100">Top Performing Contracts</h3>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
              {topContracts.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl hover:shadow-md transition-all dark:from-[#071026] dark:to-[#071428] dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {row.client.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate dark:text-slate-100">{row.client}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{row.service}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-300">{row.value.toLocaleString()} EGP</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{row.delivered}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                      row.days.includes('ahead') ? 'bg-emerald-100 text-emerald-700' :
                      row.days.includes('late') ? 'bg-rose-100 text-rose-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {row.days}
                    </span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      {row.rating}
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    </span>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

        </div>
      </div>
      <AnalyticsRangeDialog
        open={isCustomOpen}
        onOpenChange={setIsCustomOpen}
        initialStartDateUtc={customRange.startDateUtc}
        initialEndDateUtc={customRange.endDateUtc}
        onApply={handleApplyCustomRange}
        isSubmitting={isRangeSubmitting}
      />
    </DashboardLayout>
  );
}
