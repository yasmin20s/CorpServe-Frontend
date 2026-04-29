import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, FileStack, TrendingUp, Star, CalendarClock, Wallet, Quote, BarChart3 } from 'lucide-react';
import { getVendorRequestsUiStore } from '../../lib/vendorRequestsUiStore';
import { getVendorCompletedRequestsApi } from '../../services/proposalsApi';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { useSignalREvent } from '../../context/SignalRContext';

const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'My Proposals', path: '/vendor/my-proposals', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB');
}

function formatCurrency(value) {
  return `EGP ${Math.round(value).toLocaleString()}`;
}

export default function Completed() {
    const { user } = useAuth();
    const [completed, setCompleted] = useState([]);

    const loadCompleted = async () => {
      if (!user?.token) return;
      try {
        const rows = await getVendorCompletedRequestsApi({ token: user.token });
        setCompleted(rows);
      } catch (error) {
        toast.error(error.message || 'Failed to load completed requests');
      }
    };

    useEffect(() => {
      loadCompleted();
    }, [user?.token]);

    useSignalREvent(
      ['Payment completed', 'Payment failed', 'Vendor payout settled', 'Payout settled', 'Payout failed'],
      () => {
        loadCompleted();
      },
    );

    const totalEarnings = useMemo(
      () => completed.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      [completed]
    );

    const averageRating = useMemo(() => {
      if (completed.length === 0) return '0.0';
      const total = completed.reduce((sum, item) => sum + Number(item.rating || 0), 0);
      return (total / completed.length).toFixed(1);
    }, [completed]);

    const fiveStarCount = useMemo(
      () => completed.filter((item) => Number(item.rating || 0) >= 5).length,
      [completed]
    );

    const fiveStarRatio = useMemo(() => {
      if (completed.length === 0) return 0;
      return Math.round((fiveStarCount / completed.length) * 100);
    }, [completed, fiveStarCount]);

    return (
      <DashboardLayout menuItems={menuItems} userRole="vendor">
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-4 xl:sticky xl:top-6 h-fit">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#2f215f] via-[#4a53be] to-[#1b3f8f] text-white shadow-[0_22px_54px_rgba(79,70,229,0.35)] dark:bg-gradient-to-br dark:from-[#131d37] dark:via-[#1a2a4d] dark:to-[#1e3a62] dark:shadow-[0_20px_44px_rgba(2,6,23,0.58)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/16" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl dark:bg-sky-500/14" />
              <CardContent className="relative space-y-5 p-6">
                <Badge className="w-fit border border-white/25 bg-white/10 text-violet-100">Completed Work Hub</Badge>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#d8deff] sm:text-3xl">Completed Requests</h1>
                  <p className="mt-2 text-sm text-indigo-100/90">
                    A focused summary of delivered tasks, earnings, and client satisfaction.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-wide text-indigo-100">Total Earned</p>
                    <p className="mt-1 text-2xl font-black">{formatCurrency(totalEarnings)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-wide text-indigo-100">Average Rating</p>
                    <p className="mt-1 text-2xl font-black">{averageRating}/5</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-wide text-indigo-100">Five-Star Ratio</p>
                    <p className="mt-1 text-2xl font-black">{fiveStarRatio}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-indigo-200/80 bg-white shadow-sm dark:border-indigo-400/30 dark:bg-slate-900/85 dark:shadow-none">
              <CardContent className="space-y-3 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                  <BarChart3 className="h-4 w-4" />
                  Quality Breakdown
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>5-Star Deliveries</span>
                    <span>{fiveStarCount}/{completed.length || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"
                      style={{ width: `${fiveStarRatio}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            {completed.length === 0 && (
              <Card className="border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/80">
                <CardContent className="p-6">
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">No completed requests yet.</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Once a task reaches 100% and is marked completed, it appears here.</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {completed.map((project) => (
                <Card key={project.id} className="relative overflow-hidden border border-indigo-200 bg-white shadow-[0_14px_34px_rgba(79,70,229,0.14)] dark:border-indigo-400/30 dark:bg-slate-900/88 dark:shadow-none">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />

                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">{project.title}</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <span className="text-slate-500 dark:text-slate-400">Client:</span>
                          <UserAvatar
                            userId={project.clientId}
                            name={project.client}
                            profilePictureUrl={project.clientProfilePictureUrl}
                            size="sm"
                            linkClassName="max-w-[min(100%,260px)]"
                          />
                        </div>
                      </div>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-400/30 dark:bg-indigo-500/14">
                        <p className="text-xs uppercase tracking-wide text-indigo-700">Amount</p>
                        <p className="mt-1 inline-flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                          <Wallet className="h-4 w-4 text-indigo-600" />
                          {formatCurrency(project.amount)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-400/30 dark:bg-blue-500/14">
                        <p className="text-xs uppercase tracking-wide text-blue-700">Completed On</p>
                        <p className="mt-1 inline-flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                          <CalendarClock className="h-4 w-4 text-blue-600" />
                          {formatDate(project.completedDate)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-400/35 dark:bg-amber-500/16">
                      <p className="mb-1 text-xs uppercase tracking-wide text-amber-700">Client Rating</p>
                      <div className="flex items-center gap-1">
                        {[...Array(project.rating || 0)].map((_, ratingIndex) => (
                          <Star key={ratingIndex} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ml-1 font-semibold text-slate-900 dark:text-slate-100">{project.rating || 0}.0</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-violet-200 bg-violet-50/55 p-3 dark:border-violet-400/35 dark:bg-violet-500/14">
                      <p className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-violet-800">
                        <Quote className="h-4 w-4" />
                        Client Feedback
                      </p>
                      <p className="text-sm italic leading-6 text-slate-700 dark:text-slate-300">"{project.feedback || 'Client feedback pending.'}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
}
