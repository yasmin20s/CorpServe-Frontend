import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  TrendingUp,
  Wallet,
  Search,
  ArrowUpRight,
  Sparkles,
  Landmark,
  RefreshCw,
  CircleDollarSign,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getVendorReceivablesApi } from '../../services/paymentsApi';
import { toast } from '../../lib/toast';
import { useSignalREvent } from '../../context/SignalRContext';

const menuItems = [
  { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5" /> },
  { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

function CountUpNumber({ value, duration = 700, formatter = (current) => current, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;
    const targetValue = Number(value || 0);

    setDisplayValue(0);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(targetValue * easedProgress);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [duration, value]);

  return <span className={className}>{formatter(displayValue)}</span>;
}

function formatMoney(value) {
  return `EGP ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function isPayoutCompleted(status) {
  const value = normalizeStatus(status);
  return value === 'paid' || value === 'completed' || value === 'success';
}

function paymentStatusClass(status) {
  const value = normalizeStatus(status);
  if (value === 'completed' || value === 'paid') return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/16 dark:text-emerald-200 dark:border-emerald-400/35';
  if (value === 'failed' || value === 'cancelled') return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/16 dark:text-indigo-200 dark:border-indigo-400/35';
  if (value === 'pending') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/16 dark:text-orange-200 dark:border-orange-400/35';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700';
}

function payoutStatusClass(status) {
  return isPayoutCompleted(status)
    ? 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/16 dark:text-violet-200 dark:border-violet-400/35'
    : 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/16 dark:text-indigo-200 dark:border-indigo-400/35';
}

function paymentRowTone(status) {
  const value = normalizeStatus(status);
  if (value === 'completed' || value === 'paid') {
    return {
      wrapper: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/60 dark:border-emerald-400/30 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:via-slate-900 dark:to-cyan-500/10',
      stripe: 'from-emerald-500 to-cyan-500',
    };
  }
  if (value === 'pending') {
    return {
      wrapper: 'border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/60 dark:border-amber-400/30 dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-slate-900 dark:to-orange-500/10',
      stripe: 'from-amber-500 to-orange-500',
    };
  }
  if (value === 'failed' || value === 'cancelled') {
    return {
      wrapper: 'border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-pink-50/60 dark:border-rose-400/30 dark:bg-gradient-to-r dark:from-rose-500/10 dark:via-slate-900 dark:to-pink-500/10',
      stripe: 'from-rose-500 to-pink-500',
    };
  }
  return {
    wrapper: 'border-indigo-100 bg-gradient-to-r from-white via-indigo-50/20 to-violet-50/25 dark:border-indigo-400/30 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/25 dark:to-violet-950/22',
    stripe: 'from-indigo-500 to-violet-500',
  };
}

export default function VendorPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const loadPayments = async ({ silent = false } = {}) => {
    if (!user?.token) return;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await getVendorReceivablesApi({ token: user.token });
      setPayments(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load vendor payments');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user?.token]);

  useSignalREvent(
    ['Vendor payout available', 'Vendor payout settled', 'Payment completed', 'Payment failed', 'Payout settled', 'Payout failed'],
    () => {
      if (user?.token) {
        getVendorReceivablesApi({ token: user.token })
          .then((result) => setPayments(Array.isArray(result) ? result : []))
          .catch(() => {});
      }
    },
  );

  const metrics = useMemo(() => {
    const completedPayments = payments.filter((item) => normalizeStatus(item.paymentStatus) === 'completed');
    const pendingClientPayments = payments.filter((item) => normalizeStatus(item.paymentStatus) === 'pending');
    const totalGross = completedPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalReceivable = completedPayments.reduce((sum, item) => sum + Number(item.vendorNetAmount || 0), 0);
    const payoutPendingCount = completedPayments.filter((item) => !isPayoutCompleted(item.payoutStatus)).length;

    return {
      totalGross,
      totalReceivable,
      completedCount: completedPayments.length,
      pendingClientPaymentCount: pendingClientPayments.length,
      payoutPendingCount,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return payments
      .filter((payment) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'payout-pending') {
          return normalizeStatus(payment.paymentStatus) === 'completed' && !isPayoutCompleted(payment.payoutStatus);
        }
        return normalizeStatus(payment.paymentStatus) === statusFilter;
      })
      .filter((payment) => {
        if (!normalizedQuery) return true;
        const haystack = [payment.requestTitle, payment.merchantOrderId, payment.paymentId]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [payments, query, statusFilter]);

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-5">
        <Card className="relative overflow-hidden border-violet-200 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-purple-100 shadow-[0_18px_50px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-gradient-to-r dark:from-[#131d37] dark:via-[#1a2a4d] dark:to-[#1e3a62] dark:shadow-[0_20px_44px_rgba(2,6,23,0.58)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />
          <div className="absolute right-6 top-6 h-3 w-3 rounded-full bg-violet-500/80 animate-pulse dark:bg-violet-300" />
          <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-violet-300/30 blur-2xl dark:bg-violet-500/16" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 transition-transform duration-300 hover:scale-[1.02] dark:border-violet-400/35 dark:bg-slate-900 dark:text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cashboard
                </p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Vendor Payments</h1>
                <p className="mt-1 text-sm text-violet-800/80 dark:text-violet-200/85">A brand new board layout focused on speed and clarity.</p>
              </div>
              <Button
                type="button"
                onClick={() => loadPayments({ silent: true })}
                disabled={isRefreshing}
                className="gap-2 rounded-xl bg-violet-700 px-5 hover:bg-violet-800"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] xl:col-span-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100">Net Wallet</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <CountUpNumber value={metrics.totalReceivable} formatter={(current) => formatMoney(Math.round(current))} />
              </p>
              <p className="mt-2 text-xs text-indigo-100">after platform fee</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-[0_14px_34px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">Gross</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <CountUpNumber value={metrics.totalGross} formatter={(current) => formatMoney(Math.round(current))} />
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_14px_34px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">Awaiting client payment</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <CountUpNumber value={metrics.pendingClientPaymentCount} formatter={(current) => Math.round(current)} />
              </p>
              {metrics.payoutPendingCount > 0 ? (
                <p className="mt-2 text-xs text-amber-100">{metrics.payoutPendingCount} paid · payout pending</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="border-indigo-100 bg-gradient-to-r from-white via-indigo-50/35 to-sky-50/40 transition-shadow duration-300 hover:shadow-md dark:border-indigo-400/30 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/25 dark:to-slate-900 dark:hover:shadow-none">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by request, order, or payment id"
                className="h-10 rounded-xl border-indigo-100 bg-white pl-9 transition-shadow duration-300 focus-visible:ring-indigo-400 dark:border-indigo-400/30 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl border-indigo-100 bg-white transition-shadow duration-300 dark:border-indigo-400/30 dark:bg-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="payout-pending">Completed with pending payout</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/14 dark:text-indigo-200">
              {filteredPayments.length} visible
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {isLoading && <p className="py-4 text-sm text-slate-500 animate-pulse dark:text-slate-300">Loading payments data...</p>}

          {!isLoading && filteredPayments.length === 0 && (
            <Card className="border-indigo-100 bg-gradient-to-r from-white via-indigo-50/35 to-sky-50/40 xl:col-span-2 animate-pulse dark:border-indigo-400/30 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/25 dark:to-slate-900">
              <CardContent className="p-8 text-center text-sm font-medium text-indigo-700 dark:text-indigo-200">No payments match this filter.</CardContent>
            </Card>
          )}

          {!isLoading &&
            filteredPayments.map((payment) => {
              const tone = paymentRowTone(payment.paymentStatus);

              return (
                <Card key={payment.paymentId} className={`group overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${tone.wrapper}`}>
                  <CardContent className="relative p-4">
                    <div className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${tone.stripe} transition-opacity duration-300 group-hover:opacity-100`} />

                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{payment.requestTitle || `Request ${payment.requestId || '-'}`}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.paymentId || 'N/A'} • {payment.merchantOrderId || 'N/A'}</p>
                      </div>
                      <div className="rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 transition-transform duration-300 group-hover:scale-105 backdrop-blur dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100">
                        {formatMoney(payment.vendorNetAmount)}
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge className={`border ${paymentStatusClass(payment.paymentStatus)} transition-transform duration-300 group-hover:scale-[1.02]`}>{payment.paymentStatus || 'Unknown'}</Badge>
                      <Badge className={`border ${payoutStatusClass(payment.payoutStatus)} transition-transform duration-300 group-hover:scale-[1.02]`}>Payout: {payment.payoutStatus || 'pending'}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-600 dark:bg-slate-900/80">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Created</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-600 dark:bg-slate-900/80">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Gross</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMoney(payment.amount)}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-600 dark:bg-slate-900/80">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Commission</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMoney(payment.commision)}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-600 dark:bg-slate-900/80">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Net</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMoney(payment.vendorNetAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </DashboardLayout>
  );
}
