import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Search,
  ArrowUpRight,
  Sparkles,
  Wallet,
  Landmark,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { getAdminPaymentsApi, markPayoutPaidApi } from '../../services/paymentsApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';

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
  if (value === 'completed' || value === 'paid') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (value === 'failed' || value === 'cancelled') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (value === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function payoutStatusClass(status) {
  return isPayoutCompleted(status)
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-violet-100 text-violet-700 border-violet-200';
}

function paymentRowTone(status) {
  const value = normalizeStatus(status);
  if (value === 'completed' || value === 'paid') {
    return {
      wrapper: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/60',
      stripe: 'from-emerald-500 to-cyan-500',
    };
  }
  if (value === 'pending') {
    return {
      wrapper: 'border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/60',
      stripe: 'from-amber-500 to-orange-500',
    };
  }
  if (value === 'failed' || value === 'cancelled') {
    return {
      wrapper: 'border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-pink-50/60',
      stripe: 'from-rose-500 to-pink-500',
    };
  }
  return {
    wrapper: 'border-indigo-100 bg-gradient-to-r from-white via-indigo-50/20 to-violet-50/25',
    stripe: 'from-indigo-500 to-violet-500',
  };
}

export default function PaymentsMonitor() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [payoutRefs, setPayoutRefs] = useState({});

  const loadPayments = async ({ silent = false } = {}) => {
    if (!user?.token) return;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await getAdminPaymentsApi({ token: user.token });
      setPayments(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load payments monitor data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user?.token]);

  const metrics = useMemo(() => {
    const totalVolume = payments.reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0);
    const totalCommission = payments.reduce((sum, payment) => sum + Number(payment.commision || 0), 0);
    const totalVendorNet = payments.reduce((sum, payment) => sum + Number(payment.vendorNetAmount || 0), 0);
    const completedCount = payments.filter((payment) => normalizeStatus(payment.paymentStatus) === 'completed').length;
    const payoutPendingCount = payments.filter(
      (payment) => normalizeStatus(payment.paymentStatus) === 'completed' && !isPayoutCompleted(payment.payoutStatus),
    ).length;

    return {
      totalVolume,
      totalCommission,
      totalVendorNet,
      completedCount,
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
        const haystack = [
          payment.requestTitle,
          payment.clientName,
          payment.vendorName,
          payment.merchantOrderId,
          payment.paymentId,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [payments, query, statusFilter]);

  const handleMarkPayout = async (paymentId) => {
    if (!paymentId || !user?.token) return;
    setIsUpdatingId(paymentId);

    try {
      await markPayoutPaidApi({
        paymentId,
        payoutReference: payoutRefs[paymentId]?.trim() || undefined,
        token: user.token,
      });
      toast.success('Payout marked as paid successfully');
      await loadPayments({ silent: true });
    } catch (error) {
      toast.error(error.message || 'Failed to mark payout as paid');
    } finally {
      setIsUpdatingId('');
    }
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <Card className="relative overflow-hidden border-violet-200 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-purple-100 shadow-[0_18px_50px_rgba(124,58,237,0.14)]">
          <div className="absolute right-6 top-6 h-3 w-3 rounded-full bg-violet-500/80 animate-pulse" />
          <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-violet-300/30 blur-2xl" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 transition-transform duration-300 hover:scale-[1.02]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cashboard
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Payments Monitor</h1>
                <p className="mt-2 max-w-2xl text-sm text-violet-800/80">
                  Track platform cashflow, payout readiness, and transaction quality from one cinematic dashboard.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => loadPayments({ silent: true })}
                disabled={isRefreshing}
                className="gap-2 rounded-xl bg-violet-700 px-5 hover:bg-violet-800"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-100">Total Volume</p>
                <Wallet className="h-5 w-5 text-indigo-100" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                <CountUpNumber value={metrics.totalVolume} formatter={(current) => formatMoney(Math.round(current))} />
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-indigo-100">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Based on {payments.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-[0_14px_34px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Bonus</p>
                <Landmark className="h-5 w-5 text-blue-100" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                <CountUpNumber value={metrics.totalCommission} formatter={(current) => formatMoney(Math.round(current))} />
              </p>
              <p className="mt-2 text-xs text-blue-100">Platform bonus accumulated</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-[0_14px_34px_rgba(16,185,129,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-100">Vendor Net</p>
                <TrendingUp className="h-5 w-5 text-emerald-100" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                <CountUpNumber value={metrics.totalVendorNet} formatter={(current) => formatMoney(Math.round(current))} />
              </p>
              <p className="mt-2 text-xs text-emerald-100">Total transfer-ready payouts</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_14px_34px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-100">Pending Payouts</p>
                <DollarSign className="h-5 w-5 text-amber-100" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                <CountUpNumber value={metrics.payoutPendingCount} formatter={(current) => Math.round(current)} />
              </p>
              <p className="mt-2 text-xs text-amber-100">{metrics.completedCount} payments completed</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-indigo-100 bg-gradient-to-r from-white via-indigo-50/35 to-sky-50/40">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_210px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by request, client, vendor, order, or payment id"
                className="h-11 rounded-xl border-indigo-100 pl-9 focus-visible:ring-indigo-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-xl border-indigo-100">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="payout-pending">Completed with pending payout</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-xl font-bold text-slate-900">Transaction Stream</CardTitle>
            <p className="text-sm text-slate-500">{filteredPayments.length} records match your current filter</p>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            {isLoading && <p className="py-6 text-sm text-slate-500">Loading payments data...</p>}

            {!isLoading && filteredPayments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-10 text-center text-sm text-indigo-700">
                No payments match this filter.
              </div>
            )}

            {!isLoading &&
              filteredPayments.map((payment) => {
                const canMarkPayout = normalizeStatus(payment.paymentStatus) === 'completed' && !isPayoutCompleted(payment.payoutStatus);
                const isUpdating = isUpdatingId === payment.paymentId;
                const tone = paymentRowTone(payment.paymentStatus);

                return (
                  <div
                    key={payment.paymentId}
                    className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${tone.wrapper}`}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.stripe}`} />
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{payment.requestTitle || 'Untitled Request'}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Payment ID: {payment.paymentId || 'N/A'} • Order: {payment.merchantOrderId || 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`border ${paymentStatusClass(payment.paymentStatus)}`}>
                          {payment.paymentStatus || 'Unknown'}
                        </Badge>
                        <Badge className={`border ${payoutStatusClass(payment.payoutStatus)}`}>
                          Payout: {payment.payoutStatus || 'pending'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur">
                        <p className="text-xs text-slate-500">Client</p>
                        <p className="font-semibold text-slate-800">{payment.clientName || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur">
                        <p className="text-xs text-slate-500">Vendor</p>
                        <p className="font-semibold text-slate-800">{payment.vendorName || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur">
                        <p className="text-xs text-slate-500">Total Amount</p>
                        <p className="font-semibold text-slate-800">{formatMoney(payment.totalAmount)}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur">
                        <p className="text-xs text-slate-500">Commission</p>
                        <p className="font-semibold text-slate-800">{formatMoney(payment.commision)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        <p>Created: {formatDate(payment.createdAt)}</p>
                        <p>Paid: {formatDate(payment.paidAt)}</p>
                      </div>

                      {canMarkPayout && (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                          <Input
                            value={payoutRefs[payment.paymentId] || ''}
                            onChange={(event) =>
                              setPayoutRefs((current) => ({
                                ...current,
                                [payment.paymentId]: event.target.value,
                              }))
                            }
                            placeholder="Payout reference (optional)"
                            className="h-10 w-full rounded-xl border-indigo-100 sm:w-60"
                          />
                          <Button
                            type="button"
                            onClick={() => handleMarkPayout(payment.paymentId)}
                            disabled={isUpdating}
                            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                          >
                            {isUpdating ? 'Updating...' : 'Mark as paid'}
                          </Button>
                        </div>
                      )}

                      {!canMarkPayout && isPayoutCompleted(payment.payoutStatus) && (
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Payout already completed
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
