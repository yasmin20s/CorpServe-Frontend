import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, Star, Search, Sparkles, RefreshCw, ArrowUpRight } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getMyPaymentHistoryApi, getMyPendingPaymentsApi, startCheckoutApi, getPendingRatingsApi, submitRatingApi } from '../../services/paymentsApi';
import { useSignalREvent } from '../../context/SignalRContext';

const LAST_CHECKOUT_REQUEST_KEY = 'corpserve-last-checkout-request-id';
const RATING_LOOKUP_RETRIES = 6;
const RATING_LOOKUP_DELAY_MS = 1500;
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];

function formatMoney(value) {
  return `EGP ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function paymentStatusClass(status) {
  const value = normalizeStatus(status);
  if (value === 'completed' || value === 'paid') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/18 dark:text-emerald-200 dark:border-emerald-400/35';
  if (value === 'failed' || value === 'cancelled') return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/18 dark:text-rose-200 dark:border-rose-400/35';
  if (value === 'pending') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/18 dark:text-sky-200 dark:border-sky-400/35';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-500/40';
}

function paymentRowTone(status) {
  const value = normalizeStatus(status);
  if (value === 'completed' || value === 'paid') {
    return {
      wrapper: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/60 dark:border-emerald-400/30 dark:from-emerald-500/14 dark:via-slate-900 dark:to-cyan-500/12',
      stripe: 'from-emerald-500 to-cyan-500',
    };
  }
  if (value === 'pending') {
    return {
      wrapper: 'border-sky-200/70 bg-gradient-to-r from-sky-50/60 via-white to-blue-50/60 dark:border-sky-400/30 dark:from-sky-500/14 dark:via-slate-900 dark:to-blue-500/12',
      stripe: 'from-sky-500 to-blue-500',
    };
  }
  if (value === 'failed' || value === 'cancelled') {
    return {
      wrapper: 'border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-pink-50/60 dark:border-rose-400/30 dark:from-rose-500/14 dark:via-slate-900 dark:to-pink-500/12',
      stripe: 'from-rose-500 to-pink-500',
    };
  }
  return {
    wrapper: 'border-indigo-100 bg-gradient-to-r from-white via-indigo-50/20 to-violet-50/25 dark:border-slate-700 dark:from-slate-900 dark:via-indigo-500/10 dark:to-violet-500/10',
    stripe: 'from-indigo-500 to-violet-500',
  };
}

export default function Payments() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [pendingPayments, setPendingPayments] = useState([]);
    const [historyPayments, setHistoryPayments] = useState([]);
    const [loadingId, setLoadingId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null);
    const [stars, setStars] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const pickRatingTarget = (pendingRatings, historyList, preferredRequestId) => {
      if (!Array.isArray(pendingRatings) || pendingRatings.length === 0) return null;

      if (preferredRequestId) {
        const exact = pendingRatings.find((r) => r.requestId === preferredRequestId);
        if (exact) return exact;
      }

      const latestCompleted = [...(historyList || [])]
        .filter((p) => (p.paymentStatus || '').toLowerCase() === 'completed')
        .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime())[0];

      if (latestCompleted?.requestId) {
        const byLatestCompleted = pendingRatings.find((r) => r.requestId === latestCompleted.requestId);
        if (byLatestCompleted) return byLatestCompleted;
      }

      return pendingRatings[0];
    };

    const loadPayments = async ({ silent = false } = {}) => {
      if (!user?.token) return;
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const [pending, history] = await Promise.all([
          getMyPendingPaymentsApi({ token: user.token }),
          getMyPaymentHistoryApi({ token: user.token }),
        ]);
        setPendingPayments(pending);
        setHistoryPayments(history);
        return { pending, history };
      } catch (error) {
        toast.error(error.message || 'Failed to load payments');
        return { pending: [], history: [] };
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    useEffect(() => {
      loadPayments();
    }, [user?.token]);

    useSignalREvent(['Payment due', 'Payment completed', 'Payment failed'], () => {
      loadPayments();
    });

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const result = (params.get('payment_result') || '').toLowerCase();
      if (result !== 'success' || !user?.token) return;

      let cancelled = false;
      (async () => {
        const preferredRequestId = sessionStorage.getItem(LAST_CHECKOUT_REQUEST_KEY) || '';
        let selected = null;

        for (let attempt = 0; attempt < RATING_LOOKUP_RETRIES && !cancelled; attempt += 1) {
          const loaded = await loadPayments();
          const pendingRatings = await getPendingRatingsApi({ token: user.token });
          selected = pickRatingTarget(pendingRatings, loaded?.history || [], preferredRequestId);
          if (selected) break;
          if (attempt < RATING_LOOKUP_RETRIES - 1) {
            await sleep(RATING_LOOKUP_DELAY_MS);
          }
        }

        if (!cancelled) {
          if (selected) {
            setRatingTarget(selected);
            setRatingModalOpen(true);
          }
          sessionStorage.removeItem(LAST_CHECKOUT_REQUEST_KEY);
        }
        if (!cancelled) {
          params.delete('payment_result');
          navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [location.search, user?.token]);

    const totalSpent = useMemo(
      () =>
        historyPayments
          .filter((item) => (item.paymentStatus || '').toLowerCase() === 'completed')
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      [historyPayments],
    );

    const completedHistoryPayments = useMemo(
      () => historyPayments.filter((item) => (item.paymentStatus || '').toLowerCase() === 'completed'),
      [historyPayments],
    );

    const pendingTotal = useMemo(
      () => pendingPayments.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      [pendingPayments],
    );

    const filteredHistoryPayments = useMemo(() => {
      const normalizedQuery = query.trim().toLowerCase();

      return historyPayments
        .filter((payment) => {
          if (statusFilter === 'all') return true;
          return normalizeStatus(payment.paymentStatus) === statusFilter;
        })
        .filter((payment) => {
          if (!normalizedQuery) return true;
          const haystack = [
            payment.requestTitle,
            payment.paymentId,
            payment.requestId,
            payment.payoutStatus,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        })
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [historyPayments, query, statusFilter]);

    const handlePayment = async (payment) => {
      if (!user?.token) return;
      setLoadingId(payment.requestId);
      try {
        if (payment?.requestId) {
          sessionStorage.setItem(LAST_CHECKOUT_REQUEST_KEY, String(payment.requestId));
        }
        const checkout = await startCheckoutApi({ requestId: payment.requestId, token: user.token });
        if (!checkout.checkoutUrl) {
          toast.error('Checkout URL was not returned from backend.');
          return;
        }
        window.location.assign(checkout.checkoutUrl);
      } catch (error) {
        toast.error(error.message || 'Failed to start checkout');
      } finally {
        setLoadingId('');
      }
    };
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-5">
        <Card className="relative overflow-hidden border-violet-200 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-purple-100 shadow-[0_18px_50px_rgba(124,58,237,0.14)] dark:border-indigo-400/25 dark:from-[#161f3c] dark:via-[#1f2f56] dark:to-[#213866] dark:shadow-[0_20px_52px_rgba(2,6,23,0.6)]">
          <div className="absolute right-6 top-6 h-3 w-3 animate-pulse rounded-full bg-violet-500/80 dark:bg-violet-300/70" />
          <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-violet-300/30 blur-2xl dark:bg-violet-500/25" />
          <CardContent className="relative p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/75 bg-gradient-to-r from-white via-violet-50 to-fuchsia-50 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-violet-700 ring-1 ring-violet-200/70 shadow-[0_8px_22px_rgba(124,58,237,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(124,58,237,0.32)] dark:border-indigo-300/35 dark:bg-gradient-to-r dark:from-indigo-500/24 dark:via-violet-500/18 dark:to-slate-900/85 dark:text-indigo-100 dark:ring-indigo-300/30 dark:shadow-[0_10px_24px_rgba(2,6,23,0.46)]">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                  CASHBOARD
                </p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Client Payments</h1>
                <p className="mt-1 text-sm text-violet-800/80 dark:text-slate-300">Manage payments, complete pending invoices, and track your transactions clearly.</p>
              </div>
              <Button
                type="button"
                onClick={() => loadPayments({ silent: true })}
                disabled={isRefreshing}
                className="gap-2 rounded-xl bg-violet-500 px-5 text-white hover:bg-violet-600 dark:bg-violet-500 dark:hover:bg-violet-400"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100">Total Spent</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">{formatMoney(totalSpent)}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-indigo-100">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Across completed payments
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_14px_34px_rgba(59,130,246,0.30)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">Pending Payments</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">{formatMoney(pendingTotal)}</p>
              <p className="mt-2 text-xs text-sky-100">{pendingPayments.length} invoices awaiting checkout</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-[0_14px_34px_rgba(16,185,129,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Transactions</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">{completedHistoryPayments.length}</p>
              <p className="mt-2 text-xs text-emerald-100">Completed payment records</p>
            </CardContent>
          </Card>
        </div>

        {pendingPayments.length > 0 && (
          <Card className="border-sky-200 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/60 dark:border-sky-400/30 dark:from-sky-500/12 dark:via-slate-900 dark:to-blue-500/12">
            <CardHeader className="pb-2">
              <CardTitle className="text-sky-700 dark:text-sky-200">Pending Payments</CardTitle>
              <p className="text-sm text-sky-700/80 dark:text-slate-300">Please complete payment to continue creating new requests.</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {pendingPayments.map((payment) => (
                <div key={payment.paymentId} className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/78">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-blue-500" />
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{payment.requestTitle || `Request ${payment.requestId}`}</h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Invoice: INV-{payment.requestId} • {formatDate(payment.createdAt)}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Service: {formatMoney(payment.amount)} • Commission: {formatMoney(payment.commision)}</p>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatMoney(payment.totalAmount)}</p>
                      <Button onClick={() => handlePayment(payment)} disabled={loadingId === payment.requestId} className="rounded-xl bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500">
                        {loadingId === payment.requestId ? 'Redirecting...' : 'Pay Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-indigo-100 bg-gradient-to-r from-white via-indigo-50/35 to-sky-50/40 transition-shadow duration-300 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:via-indigo-500/10 dark:to-sky-500/10 dark:hover:shadow-[0_18px_36px_rgba(2,6,23,0.5)]">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by request, payment id, or payout status"
                className="h-10 rounded-xl border-indigo-100 bg-white pl-9 transition-shadow duration-300 focus-visible:ring-indigo-400 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-indigo-400/60"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl border-indigo-100 bg-white transition-shadow duration-300 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:text-slate-100">
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/16 dark:text-indigo-200">
              {filteredHistoryPayments.length} visible
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/90">
          <CardHeader className="pb-1">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Stream</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{filteredHistoryPayments.length} records match your current filter</p>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            {isLoading && <p className="animate-pulse py-4 text-sm text-slate-500 dark:text-slate-400">Loading payments data...</p>}

            {!isLoading && filteredHistoryPayments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-10 text-center text-sm text-indigo-700 dark:border-indigo-400/35 dark:bg-indigo-500/12 dark:text-indigo-200">
                No payments match this filter.
              </div>
            )}

            {!isLoading &&
              filteredHistoryPayments.map((transaction) => {
                const tone = paymentRowTone(transaction.paymentStatus);

                return (
                  <div key={transaction.paymentId} className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${tone.wrapper}`}>
                    <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.stripe}`} />

                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{transaction.requestTitle || `Request ${transaction.requestId}`}</h3>
                        <p className="mt-1 text-xs text-slate-500">Payment ID: {transaction.paymentId || 'N/A'} • {formatDate(transaction.createdAt)}</p>
                      </div>
                      <div className="rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {formatMoney(transaction.totalAmount)}
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge className={`border ${paymentStatusClass(transaction.paymentStatus)}`}>
                        {transaction.paymentStatus || 'Unknown'}
                      </Badge>
                      <Badge className="border border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-400/35 dark:bg-violet-500/18 dark:text-violet-200">
                        Payout: {transaction.payoutStatus || 'pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-600 dark:bg-slate-800">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Service</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatMoney(transaction.amount)}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-600 dark:bg-slate-800">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Commission</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatMoney(transaction.commision)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
        <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
          <DialogContent className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <DialogHeader>
              <DialogTitle>Rate Vendor Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{ratingTarget?.requestTitle || 'Completed request'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Vendor: {ratingTarget?.vendorName || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setStars(value)} className="focus:outline-none">
                      <Star className={`h-7 w-7 ${value <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comment (Optional)</Label>
                <Textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share optional feedback about the vendor"
                />
              </div>
              <Button
                disabled={stars < 1 || ratingSubmitting || !ratingTarget?.requestId}
                onClick={async () => {
                  if (!user?.token || !ratingTarget?.requestId) return;
                  setRatingSubmitting(true);
                  try {
                    await submitRatingApi({
                      requestId: ratingTarget.requestId,
                      stars,
                      comment,
                      token: user.token,
                    });
                    toast.success('Rating submitted successfully.');
                    setRatingModalOpen(false);
                    setRatingTarget(null);
                    setStars(0);
                    setComment('');
                  } catch (error) {
                    toast.error(error.message || 'Failed to submit rating');
                  } finally {
                    setRatingSubmitting(false);
                  }
                }}
                className="w-full"
              >
                {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>);
}

