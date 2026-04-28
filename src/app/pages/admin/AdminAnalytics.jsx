import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  CalendarDays,
  BarChart3,
  Timer,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
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
const TIME_RANGES = ['7 Days', '30 Days', '90 Days', 'Custom'];

const METRICS = [
  {
    key: 'gmv',
    label: 'GMV',
    value: '1,847,000 EGP',
    delta: '+31%',
    icon: BarChart3,
    tone: 'purple',
    showAlert: false,
  },
  {
    key: 'active',
    label: 'Active Users (30d)',
    value: '847',
    delta: null,
    icon: Users,
    tone: 'blue',
    showAlert: false,
  },
  {
    key: 'match',
    label: 'Avg Time to Match',
    value: '3.2 hrs',
    delta: null,
    icon: Timer,
    tone: 'amber',
    showAlert: false,
  },
  {
    key: 'sla',
    label: 'SLA Compliance',
    value: '94%',
    delta: null,
    icon: ShieldCheck,
    tone: 'violet',
    showAlert: false,
  },
];

const gmvData = [
  { month: 'May', GMV: 0.45 },
  { month: 'Jun', GMV: 0.92 },
  { month: 'Jul', GMV: 0.96 },
  { month: 'Aug', GMV: 1.8 },
  { month: 'Sep', GMV: 1.05 },
  { month: 'Oct', GMV: 1.65 },
  { month: 'Nov', GMV: 1.88 },
  { month: 'Dec', GMV: 1.72 },
  { month: 'Jan', GMV: 0.86 },
  { month: 'Feb', GMV: 1.74 },
  { month: 'Mar', GMV: 1.35 },
  { month: 'Apr', GMV: 1.9 },
];

const serviceCategories = [
  { name: 'IT', value: 34, color: '#9f7aea' },
  { name: 'Legal', value: 24, color: '#f9a8d4' },
  { name: 'Logistics', value: 16, color: '#93c5fd' },
  { name: 'HR', value: 20, color: '#fde68a' },
  { name: 'Other', value: 6, color: '#c4b5fd' },
];

const userGrowth = [
  { month: 'Nov', clients: 280, vendors: 160, admins: 60 },
  { month: 'Dec', clients: 320, vendors: 190, admins: 70 },
  { month: 'Jan', clients: 360, vendors: 230, admins: 80 },
  { month: 'Feb', clients: 420, vendors: 260, admins: 85 },
  { month: 'Mar', clients: 460, vendors: 290, admins: 92 },
  { month: 'Apr', clients: 520, vendors: 310, admins: 100 },
];

const USER_GROWTH_SERIES = [
  { key: 'clients', label: 'Clients', color: '#8b5cf6' },
  { key: 'vendors', label: 'Vendors', color: '#60a5fa' },
  { key: 'admins', label: 'Admins', color: '#f472b6' },
];

const revenueSplit = [
  { name: 'Vendor Payout', value: 87.6, color: '#8b5cf6' },
  { name: 'Platform Fee', value: 12.4, color: '#facc15' },
];

const topVendors = [
  { name: 'TechVision LLC', value: 1847 },
  { name: 'Nile Legal Grp', value: 827 },
  { name: 'Delta Consult', value: 768 },
  { name: 'SkyBuild Co.', value: 545 },
  { name: 'OmniHR Solutions', value: 537 },
];

const riskFlags = [
  {
    type: 'SLA Breach Risk',
    entity: 'TechVision LLC',
    description: 'Emirates SLA breach risk',
    severity: 'High',
    detected: '30/07/2023',
  },
  {
    type: 'Payment Overdue',
    entity: 'Nile Legal Grp',
    description: 'Past-due payment overdue',
    severity: 'Medium',
    detected: '30/07/2023',
  },
  {
    type: 'Vendor Inactive',
    entity: 'Delta Consult',
    description: 'Vendor inactive 21 days',
    severity: 'Low',
    detected: '06/07/2023',
  },
];

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
  const [activeRange, setActiveRange] = useState('30 Days');

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
                onClick={() => setActiveRange(label)}
                aria-pressed={activeRange === label}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
                {metric.showAlert && (
                  <div className="aa-metric-alert">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                )}
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
            <span className="aa-pill">YTD : 1.8M EGP</span>
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
              <span className="aa-pill aa-pill-soft">3 Active Flags</span>
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
      </div>
    </DashboardLayout>
  );
}
