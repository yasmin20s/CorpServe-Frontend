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
  if (value === 'completed' || value === 'paid') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (value === 'failed' || value === 'cancelled') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (value === 'pending') return 'bg-sky-100 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
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
      wrapper: 'border-sky-200/70 bg-gradient-to-r from-sky-50/60 via-white to-blue-50/60',
      stripe: 'from-sky-500 to-blue-500',
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
        <Card className="relative overflow-hidden border-violet-200 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-purple-100 shadow-[0_18px_50px_rgba(124,58,237,0.14)]">
          <div className="absolute right-6 top-6 h-3 w-3 rounded-full bg-violet-500/80 animate-pulse" />
          <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-violet-300/30 blur-2xl" />
          <CardContent className="relative p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 transition-transform duration-300 hover:scale-[1.02]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cashboard
                </p>
                <h1 className="text-3xl font-black text-slate-900">Client Payments</h1>
                <p className="mt-1 text-sm text-violet-800/80">Manage payments, complete pending invoices, and track your transactions clearly.</p>
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
          <Card className="border-sky-200 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sky-700">Pending Payments</CardTitle>
              <p className="text-sm text-sky-700/80">Please complete payment to continue creating new requests.</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {pendingPayments.map((payment) => (
                <div key={payment.paymentId} className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-white/90 p-4 shadow-sm">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-blue-500" />
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{payment.requestTitle || `Request ${payment.requestId}`}</h4>
                      <p className="mt-1 text-xs text-slate-500">Invoice: INV-{payment.requestId} • {formatDate(payment.createdAt)}</p>
                      <p className="mt-1 text-sm text-slate-600">Service: {formatMoney(payment.amount)} • Commission: {formatMoney(payment.commision)}</p>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      <p className="text-lg font-bold text-slate-900">{formatMoney(payment.totalAmount)}</p>
                      <Button onClick={() => handlePayment(payment)} disabled={loadingId === payment.requestId} className="rounded-xl bg-violet-700 hover:bg-violet-800">
                        {loadingId === payment.requestId ? 'Redirecting...' : 'Pay Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-indigo-100 bg-gradient-to-r from-white via-indigo-50/35 to-sky-50/40 transition-shadow duration-300 hover:shadow-md">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by request, payment id, or payout status"
                className="h-10 rounded-xl border-indigo-100 bg-white pl-9 transition-shadow duration-300 focus-visible:ring-indigo-400"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl border-indigo-100 bg-white transition-shadow duration-300">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700">
              {filteredHistoryPayments.length} visible
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-xl font-bold text-slate-900">Transaction Stream</CardTitle>
            <p className="text-sm text-slate-500">{filteredHistoryPayments.length} records match your current filter</p>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            {isLoading && <p className="py-4 text-sm text-slate-500 animate-pulse">Loading payments data...</p>}

            {!isLoading && filteredHistoryPayments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-10 text-center text-sm text-indigo-700">
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
                      <div className="rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur">
                        {formatMoney(transaction.totalAmount)}
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge className={`border ${paymentStatusClass(transaction.paymentStatus)}`}>
                        {transaction.paymentStatus || 'Unknown'}
                      </Badge>
                      <Badge className="border border-violet-200 bg-violet-100 text-violet-700">
                        Payout: {transaction.payoutStatus || 'pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur">
                        <p className="text-[11px] text-slate-500">Service</p>
                        <p className="text-sm font-semibold text-slate-800">{formatMoney(transaction.amount)}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 backdrop-blur">
                        <p className="text-[11px] text-slate-500">Commission</p>
                        <p className="text-sm font-semibold text-slate-800">{formatMoney(transaction.commision)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
        <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Vendor Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-gray-50">
                <p className="text-sm text-gray-700 font-medium">{ratingTarget?.requestTitle || 'Completed request'}</p>
                <p className="text-xs text-gray-500">Vendor: {ratingTarget?.vendorName || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setStars(value)} className="focus:outline-none">
                      <Star className={`h-7 w-7 ${value <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
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

