import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, CalendarDays, BarChart3, Timer, ShieldCheck } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import AnalyticsRangeDialog from '../../components/AnalyticsRangeDialog';
import { getAdminAnalyticsApi } from '../../services/analyticsApi';

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
const USER_GROWTH_SERIES = [
  { key: 'clients', label: 'Clients', color: '#8b5cf6' },
  { key: 'vendors', label: 'Vendors', color: '#60a5fa' },
  { key: 'admins', label: 'Admins', color: '#f472b6' },
];
const TIME_RANGES = ['7 Days', '30 Days', '90 Days', 'Custom'];
const RANGE_KEY_BY_LABEL = { '7 Days': '7days', '30 Days': '30days', '90 Days': '90days', Custom: 'custom' };
const ACTIVE_USERS_SUFFIX = { '7 Days': '7d', '30 Days': '30d', '90 Days': '90d' };
const CATEGORY_COLORS = ['#9f7aea', '#f9a8d4', '#93c5fd', '#fde68a', '#c4b5fd'];

const AXIS_TICK = { fill: 'var(--aa-axis)' };
const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--aa-tooltip-bg)',
  border: '1px solid var(--aa-tooltip-border)',
  borderRadius: '12px',
  color: 'var(--aa-tooltip-text)',
  boxShadow: 'var(--aa-tooltip-shadow)',
};

const formatPercent = (value, name) => [`${value}%`, name];
const formatMillions = (value) => `${value}M`;
const formatRevenue = (value) => `${value}k EGP`;
export default function AdminAnalytics() {
  const { user } = useAuth();
  const [activeRange, setActiveRange] = useState('30 Days');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ startDateUtc: null, endDateUtc: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isRangeSubmitting, setIsRangeSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState({
    overview: {},
    platformGmvTrend: [],
    topServiceCategories: [],
    userGrowth: [],
    revenueSplit: {},
    topVendorsByRevenue: [],
    anomalyRiskFlags: { flags: [], activeFlagsCount: 0 },
  });

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const rangeKey = RANGE_KEY_BY_LABEL[activeRange] || '30days';
        const payload = await getAdminAnalyticsApi({
          token: user.token,
          rangeKey,
          startDateUtc: rangeKey === 'custom' ? customRange.startDateUtc : undefined,
          endDateUtc: rangeKey === 'custom' ? customRange.endDateUtc : undefined,
        });
        if (!cancelled) setAnalytics(payload);
      } catch (error) {
        if (!cancelled) toast.error(error?.message || 'Failed to load admin analytics.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const selectedRangeKey = RANGE_KEY_BY_LABEL[activeRange] || '30days';
    if (selectedRangeKey === 'custom' && (!customRange.startDateUtc || !customRange.endDateUtc)) return;
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.token, activeRange, customRange.startDateUtc, customRange.endDateUtc]);

  const activeUsersSuffix = ACTIVE_USERS_SUFFIX[activeRange] || (activeRange === 'Custom' && analytics?.dateRange?.daysCount ? `${analytics.dateRange.daysCount}d` : '');

  const METRICS = useMemo(() => ([
    {
      key: 'gmv',
      label: 'GMV',
      value: `${Number(analytics?.overview?.gmvEGP || 0).toLocaleString()} EGP`,
      delta: `${Number(analytics?.overview?.gmvChangePercent || 0) >= 0 ? '+' : ''}${Number(analytics?.overview?.gmvChangePercent || 0).toFixed(1)}%`,
      icon: BarChart3,
      tone: 'purple',
    },
    {
      key: 'active',
      label: `Active Users${activeUsersSuffix ? ` (${activeUsersSuffix})` : ''}`,
      value: `${Number(analytics?.overview?.activeUsersCount || 0)}`,
      delta: null,
      icon: Users,
      tone: 'blue',
    },
    {
      key: 'match',
      label: 'Avg Time to Match',
      value: `${Number(analytics?.overview?.avgTimeToMatchHours || 0).toFixed(1)} hrs`,
      delta: null,
      icon: Timer,
      tone: 'amber',
    },
    {
      key: 'sla',
      label: 'SLA Compliance',
      value: `${Number(analytics?.overview?.slaCompliancePercent || 0).toFixed(1)}%`,
      delta: null,
      icon: ShieldCheck,
      tone: 'violet',
    },
  ]), [analytics, activeUsersSuffix]);

  const gmvData = useMemo(
    () => (analytics.platformGmvTrend || []).map((item) => ({ month: item.label, GMV: Number(item.gmvEGP || 0) / 1000000 })),
    [analytics.platformGmvTrend],
  );
  const serviceCategories = useMemo(
    () => (analytics.topServiceCategories || []).map((item, idx) => ({ name: item.categoryName, value: Number(item.percentage || 0), color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] })),
    [analytics.topServiceCategories],
  );
  const userGrowth = useMemo(
    () => (analytics.userGrowth || []).map((item) => ({ month: item.label, clients: Number(item.clientsCount || 0), vendors: Number(item.vendorsCount || 0), admins: Number(item.adminsCount || 0) })),
    [analytics.userGrowth],
  );
  const revenueSplit = useMemo(() => ([
    { name: 'Vendor Payout', value: Number(analytics?.revenueSplit?.vendorPayoutPercent || 0), color: '#8b5cf6' },
    { name: 'Platform Fee', value: Number(analytics?.revenueSplit?.platformFeePercent || 0), color: '#facc15' },
  ]), [analytics?.revenueSplit]);
  const topVendors = useMemo(
    () => (analytics.topVendorsByRevenue || []).map((item) => ({ name: item.vendorName || 'Vendor', value: Math.round(Number(item.revenueEGP || 0) / 1000) })),
    [analytics.topVendorsByRevenue],
  );
  const riskFlags = useMemo(
    () => (analytics?.anomalyRiskFlags?.flags || []).map((flag) => ({
      type: flag.type,
      entity: flag.entity,
      description: flag.description,
      severity: flag.severity,
      detected: flag.detectedAtUtc ? new Date(flag.detectedAtUtc).toLocaleDateString('en-GB') : '-',
    })),
    [analytics?.anomalyRiskFlags?.flags],
  );

  const handleRangeClick = (label) => {
    if (label === 'Custom') {
      setIsCustomOpen(true);
      return;
    }
    setActiveRange(label);
  };

  const handleApplyCustomRange = async ({ startDateUtc, endDateUtc }) => {
    setIsRangeSubmitting(true);
    setCustomRange({ startDateUtc, endDateUtc });
    setActiveRange('Custom');
    setIsCustomOpen(false);
    setIsRangeSubmitting(false);
  };

  const renderUserGrowthTooltip = ({ active, label, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const valuesByKey = payload.reduce((acc, entry) => {
      acc[entry.dataKey] = entry.value;
      return acc;
    }, {});

    return (
      <div className="aa-tooltip">
        <p className="aa-tooltip-label">{label}</p>
        <div className="aa-tooltip-list">
          {USER_GROWTH_SERIES.map((series) => (
            <div key={series.key} className="aa-tooltip-row">
              <span className="aa-tooltip-name">
                <span className="aa-tooltip-dot" style={{ backgroundColor: series.color }} />
                {series.label}
              </span>
              <span className="aa-tooltip-value">{valuesByKey[series.key] ?? '-'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="aa-analytics">
        <div className="aa-glow aa-glow-left" />
        <div className="aa-glow aa-glow-right" />

        <section className="aa-hero-visual">
          <div className="aa-hero-blobs">
            <div className="aa-blob aa-blob-1" />
            <div className="aa-blob aa-blob-2" />
            <div className="aa-blob aa-blob-3" />
            <div className="aa-blob aa-blob-4" />
          </div>

          <div className="aa-hero-visual-content">
            <div className="aa-hero-text-area">
              <p className="aa-hero-eyebrow-vis">ADMIN ANALYTICS</p>
              <h1 className="aa-hero-title-vis">
                Control tower for <span className="aa-text-purple">platform performance</span>
              </h1>
              <p className="aa-hero-desc-vis">
                Live GMV signals, user momentum, vendor health, and SLA compliance in one view.
              </p>
            </div>

            <div className="aa-hero-glass-icons">
              <div className="aa-glass-icon-wrapper aa-blue-glow">
                <Users strokeWidth={1.5} className="w-8 h-8" />
              </div>
              <div className="aa-glass-icon-wrapper aa-pink-glow">
                <ShieldCheck strokeWidth={1.5} className="w-8 h-8" />
              </div>
              <div className="aa-glass-icon-wrapper aa-yellow-glow">
                <Timer strokeWidth={1.5} className="w-8 h-8" />
              </div>
            </div>
          </div>
        </section>

        <div className="aa-toolbar">
          <div className="aa-tabs" role="tablist" aria-label="Date range">
            <CalendarDays className="aa-calendar" />
            {TIME_RANGES.map((label) => (
              <button
                key={label}
                type="button"
                className={`aa-tab ${activeRange === label ? 'aa-tab-active' : ''}`}
                onClick={() => handleRangeClick(label)}
                aria-pressed={activeRange === label}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-300">
            Loading analytics...
          </div>
        ) : null}

        <div className="aa-metric-grid">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.key} className={`aa-metric aa-metric-${metric.tone}`}>
                <div className="aa-metric-icon">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="aa-metric-label">{metric.label}</div>
                  <div className="aa-metric-value">
                    {metric.value}
                    {metric.delta && <span className="aa-metric-delta">{metric.delta}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="aa-card aa-card-wide">
          <div className="aa-card-header">
            <div>
              <h2>Platform GMV Over Time</h2>
              <p>Revenue trend over the year</p>
            </div>
              <span className="aa-pill">YTD : {(Number(analytics?.overview?.gmvEGP || 0) / 1000000).toFixed(2)}M EGP</span>
          </div>
          <div className="aa-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gmvData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9f7aea" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="var(--aa-grid)" />
                <XAxis dataKey="month" stroke="var(--aa-axis)" fontSize={12} tick={AXIS_TICK} />
                <YAxis stroke="var(--aa-axis)" fontSize={12} tick={AXIS_TICK} tickFormatter={formatMillions} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={formatMillions} />
                <Area type="monotone" dataKey="GMV" stroke="#8b5cf6" fill="url(#gmvFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="aa-grid-3">
          <div className="aa-card">
            <div className="aa-card-header">
              <h3>Top Service Categories</h3>
            </div>
            <div className="aa-chart-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {serviceCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={formatPercent} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="aa-card">
            <div className="aa-card-header aa-card-header-row">
              <h3>User Growth</h3>
              <div className="aa-legend">
                <span className="aa-legend-item aa-legend-clients">Clients</span>
                <span className="aa-legend-item aa-legend-vendors">Vendors</span>
                <span className="aa-legend-item aa-legend-admins">Admins</span>
              </div>
            </div>
            <div className="aa-chart-sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clientsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9f7aea" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#ddd6fe" stopOpacity={0.12} />
                    </linearGradient>
                    <linearGradient id="vendorsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#dbeafe" stopOpacity={0.12} />
                    </linearGradient>
                    <linearGradient id="adminsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f9a8d4" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#fce7f3" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" stroke="var(--aa-grid)" />
                  <XAxis dataKey="month" stroke="var(--aa-axis)" fontSize={12} tick={AXIS_TICK} />
                  <YAxis stroke="var(--aa-axis)" fontSize={12} tick={AXIS_TICK} />
                  <Tooltip content={renderUserGrowthTooltip} />
                  <Area type="monotone" dataKey="clients" stroke="#8b5cf6" fill="url(#clientsFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="vendors" stroke="#60a5fa" fill="url(#vendorsFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="admins" stroke="#f472b6" fill="url(#adminsFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="aa-card">
            <div className="aa-card-header">
              <h3>Revenue Split</h3>
            </div>
            <div className="aa-chart-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueSplit} innerRadius={70} outerRadius={95} dataKey="value">
                    {revenueSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={formatPercent} />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="aa-donut-value">
                    12.4%
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="aa-donut-label">
                    Platform
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="aa-revenue">
              <div>
                <span>Vendor Payout</span>
                <strong>87.6%</strong>
              </div>
              <div>
                <span>Platform Fee</span>
                <strong>12.4%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="aa-grid-2">
          <div className="aa-card">
            <div className="aa-card-header">
              <h3>Top Vendors by Revenue</h3>
            </div>
            <div className="aa-chart-sm aa-chart-bars">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendors} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <defs>
                    <linearGradient id="vendorBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" stroke="var(--aa-grid)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={AXIS_TICK} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={formatRevenue} />
                  <Bar dataKey="value" fill="url(#vendorBar)" radius={[8, 8, 8, 8]}>
                    <LabelList dataKey="value" position="right" fill="var(--aa-axis)" formatter={(value) => `${value}k`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="aa-card">
            <div className="aa-card-header aa-card-header-row">
              <h3>Anomaly & Risk Flags</h3>
              <span className="aa-pill aa-pill-soft">{Number(analytics?.anomalyRiskFlags?.activeFlagsCount || 0)} Active Flags</span>
            </div>
            <div className="aa-table">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Entity</th>
                    <th>Description</th>
                    <th>Severity</th>
                    <th>Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {riskFlags.map((flag) => (
                    <tr key={flag.type}>
                      <td className="aa-table-strong">{flag.type}</td>
                      <td>{flag.entity}</td>
                      <td>{flag.description}</td>
                      <td>
                        <span className={`aa-severity aa-severity-${flag.severity.toLowerCase()}`}>
                          {flag.severity}
                        </span>
                      </td>
                      <td>{flag.detected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>
    </DashboardLayout>
  );
}
