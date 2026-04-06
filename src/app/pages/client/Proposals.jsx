import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, CheckCircle, X, Star, CalendarDays, HandCoins, ShieldCheck, Sparkles, CircleAlert } from 'lucide-react';
import { toast } from '../../lib/toast';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const vendorNamesPool = [
  'SecureGuard Solutions',
  'TotalSecurity Inc',
  'SafetyFirst Systems',
  'PrimeCore Services',
  'BlueOrbit Technologies',
  'Apex Facility Experts',
  'NexusPro Works',
  'UrbanShield Group',
  'Delta Ops Services',
  'Vertex Enterprise Care',
];

const dummyMessagesPool = [
  'Our team can deliver this request with clear milestones, weekly updates, and documented QA checks.',
  'We propose a structured rollout plan with risk mitigation and post-delivery support included.',
  'This offer includes implementation, testing, and handover with detailed knowledge transfer.',
  'We have completed similar requests for enterprise clients and can start immediately after approval.',
  'Our proposal focuses on speed and reliability while keeping the scope aligned with your target outcome.',
];

  function normalizeVendorProposals(rawProposals = []) {
    if (!Array.isArray(rawProposals)) return [];

    return rawProposals.map((proposal, idx) => ({
      id: String(proposal?.id || `vendor-${idx + 1}`),
      vendorName: proposal?.vendorName || proposal?.vendor?.fullName || proposal?.vendor?.name || `Vendor ${idx + 1}`,
      vendorRating: Number(proposal?.vendorRating ?? proposal?.vendor?.rating ?? 4.5),
      vendorCompletedJobs: Number(proposal?.vendorCompletedJobs ?? proposal?.vendor?.completedJobs ?? 0),
      proposedBudget: proposal?.proposedBudget || proposal?.budget || 'EGP 0',
      proposedDeadline: proposal?.proposedDeadline || proposal?.deadline || '-',
      message: proposal?.message || proposal?.proposalMessage || 'No details were provided by this vendor.',
      estimatedDuration: proposal?.estimatedDuration || '-',
    }));
  }

  function buildDummyProposals({
    count,
    requestTitle,
    budgetMin,
    budgetMax,
  }) {
    if (!count || count <= 0) return [];

    const safeMin = Number.isFinite(budgetMin) && budgetMin > 0 ? budgetMin : 15000;
    const safeMax = Number.isFinite(budgetMax) && budgetMax > safeMin ? budgetMax : safeMin + 5000;
    const span = Math.max(1000, safeMax - safeMin);

    return Array.from({ length: count }, (_, idx) => {
      const vendorName = vendorNamesPool[idx % vendorNamesPool.length];
      const waveOffset = ((idx % 5) - 2) * Math.round(span * 0.12);
      const proposedBudgetValue = Math.max(1000, safeMin + Math.round(span * 0.55) + waveOffset);
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 8 + (idx * 3));
      const rating = Math.min(5, Math.max(3.8, 4.2 + ((idx % 4) * 0.15)));
      const completedJobs = 40 + (idx * 17);
      const messageTemplate = dummyMessagesPool[idx % dummyMessagesPool.length];

      return {
        id: `dummy-${idx + 1}`,
        vendorName,
        vendorRating: Number(rating.toFixed(1)),
        vendorCompletedJobs: completedJobs,
        proposedBudget: `EGP ${proposedBudgetValue.toLocaleString()}`,
        proposedDeadline: deadlineDate.toLocaleDateString(),
        message: `${messageTemplate} Request: ${requestTitle}.`,
        estimatedDuration: `${2 + (idx % 4)} weeks`,
      };
    });
  }

export default function Proposals() {
    const { requestId } = useParams();
  const location = useLocation();
  const requestData = location.state?.request || null;
    const itemsPerPage = 4;
    const [showSLA, setShowSLA] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

      const parseCurrencyValue = (value) => {
        if (!value) return 0;
        const numeric = Number(String(value).replace(/[^\d.]/g, ''));
        return Number.isNaN(numeric) ? 0 : numeric;
      };

      const formatCurrency = (value) => `EGP ${Number(value || 0).toLocaleString()}`;

      const clientBudgetMin = parseCurrencyValue(requestData?.budgetMin) || 15000;
      const clientBudgetMax = parseCurrencyValue(requestData?.budgetMax) || 20000;
      const clientDeadline = requestData?.expectedDeadline || 'April 30, 2026';
      const requestTitle = requestData?.title || `Request ${requestId}`;

      const vendorProvidedProposals = useMemo(() => {
        return normalizeVendorProposals(
          requestData?.proposals
          || requestData?.vendorProposals
          || requestData?.offers
          || [],
        );
      }, [requestData]);

      const declaredCount = Number(
        requestData?.proposalsCount
        ?? requestData?.proposalCount
        ?? requestData?.numberOfProposals
        ?? requestData?.vendorProposalsCount
        ?? vendorProvidedProposals.length
        ?? 0,
      );

      const proposalsSource = useMemo(() => {
        if (vendorProvidedProposals.length > 0) return vendorProvidedProposals;
        return buildDummyProposals({
          count: Math.max(0, declaredCount || 6),
          requestTitle,
          budgetMin: clientBudgetMin,
          budgetMax: clientBudgetMax,
        });
      }, [vendorProvidedProposals, declaredCount, requestTitle, clientBudgetMin, clientBudgetMax]);

      const proposals = useMemo(() => {
        return proposalsSource.map((proposal, idx) => {
          const parsed = parseCurrencyValue(proposal.proposedBudget);
          const inClientRange = parsed >= clientBudgetMin && parsed <= clientBudgetMax;
          return {
            ...proposal,
            id: `${requestId || 'req'}-${proposal.id}`,
            inClientRange,
            delay: idx * 70,
          };
        });
      }, [proposalsSource, requestId, clientBudgetMin, clientBudgetMax]);

      const proposalsInRange = proposals.filter((proposal) => proposal.inClientRange).length;
      const totalPages = Math.max(1, Math.ceil(proposals.length / itemsPerPage));
      const safeCurrentPage = Math.min(currentPage, totalPages);
      const paginatedProposals = proposals.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

    const handleAccept = (proposal) => {
        setSelectedProposal(proposal);
        setShowSLA(true);
    };
    const handleReject = (vendorName) => {
        toast.success(`Proposal from ${vendorName} rejected`);
    };
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="relative space-y-7 overflow-hidden">
        <style>{`
          @keyframes prismShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes orbitalFloat {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .55; }
            50% { transform: translate3d(0, -14px, 0) scale(1.06); opacity: .95; }
          }

          @keyframes spinHalo {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes liftIn {
            0% { opacity: 0; transform: translateY(22px) scale(.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes linePulse {
            0%, 100% { opacity: .35; }
            50% { opacity: .95; }
          }

          @keyframes badgeGlow {
            0%, 100% { box-shadow: 0 0 0 rgba(79,70,229,0); }
            50% { box-shadow: 0 0 14px rgba(37,99,235,.28), 0 0 22px rgba(250,204,21,.18); }
          }

          .proposal-lift-in {
            opacity: 0;
            animation: liftIn 580ms cubic-bezier(.21,.84,.27,1) forwards;
            animation-delay: var(--enter-delay, 0ms);
          }

          .proposal-prism-bg {
            background-size: 220% 220%;
            animation: prismShift 12s ease-in-out infinite;
          }

          .proposal-status-glow {
            animation: badgeGlow 3s ease-in-out infinite;
          }
        `}</style>

        <div className="pointer-events-none absolute -left-20 top-14 h-52 w-52 rounded-full bg-blue-300/35 blur-3xl" style={{ animation: 'orbitalFloat 8s ease-in-out infinite' }} />
        <div className="pointer-events-none absolute -right-12 top-40 h-56 w-56 rounded-full bg-yellow-300/25 blur-3xl" style={{ animation: 'orbitalFloat 10s ease-in-out infinite 0.6s' }} />

        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]" style={{ '--enter-delay': '40ms' }}>
          <Card className="proposal-lift-in relative overflow-hidden border-0 p-0 shadow-[0_20px_44px_rgba(67,56,202,0.22)]">
            <div className="proposal-prism-bg relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dbe3ff] via-[#d9d2ff] to-[#fff1b8] p-7 md:p-9">
              <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/35 blur-2xl" />
              <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-blue-200/40 blur-2xl" />
              <div className="relative z-10 space-y-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  Proposal Arena
                </p>
                <h1 className="text-3xl font-black leading-tight text-indigo-950 md:text-4xl">Vendor Proposals for {requestTitle}</h1>
                <p className="max-w-2xl text-sm text-indigo-900/75 md:text-base">Compare quality, budget fit, and delivery speed. Choose the strongest offer with confidence.</p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge className="border border-blue-300 bg-white/80 text-blue-700">{proposals.length} Offers</Badge>
                  <Badge className="border border-yellow-300 bg-yellow-50/90 text-yellow-700">{proposalsInRange} In Budget Range</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="proposal-lift-in relative overflow-hidden border border-blue-200/80 bg-white/80 shadow-[0_14px_30px_rgba(37,99,235,0.14)]" style={{ '--enter-delay': '120ms' }}>
            <CardContent className="p-6">
              <div className="relative mx-auto mb-4 flex h-40 w-40 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500 shadow-[0_0_24px_rgba(37,99,235,0.35)]"
                  style={{ animation: 'spinHalo 14s linear infinite' }}
                />
                <div
                  className="absolute inset-2 rounded-full border border-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.3)]"
                  style={{ animation: 'spinHalo 9s linear infinite reverse' }}
                />
                <div
                  className="absolute inset-6 rounded-full border border-yellow-400/80"
                  style={{ animation: 'spinHalo 6.5s linear infinite' }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/10 via-violet-400/8 to-yellow-300/12" />
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
                  <span className="text-3xl font-black">{proposalsInRange}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Matched</span>
                </div>
              </div>
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-blue-700">Client Budget Window</p>
              <p className="mt-1 text-center text-lg font-black text-slate-900">{formatCurrency(clientBudgetMin)} - {formatCurrency(clientBudgetMax)}</p>
              <p className="mt-3 text-center text-xs text-slate-600">Target deadline: <span className="font-bold text-violet-700">{clientDeadline}</span></p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" style={{ '--enter-delay': '180ms' }}>
          <Card className="proposal-lift-in border border-blue-200 bg-white/85 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Budget Frame</p>
              <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(clientBudgetMin)} - {formatCurrency(clientBudgetMax)}</p>
            </CardContent>
          </Card>
          <Card className="proposal-lift-in border border-violet-200 bg-white/85 shadow-sm" style={{ '--enter-delay': '230ms' }}>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">Deadline Target</p>
              <p className="mt-1 text-xl font-black text-slate-900">{clientDeadline}</p>
            </CardContent>
          </Card>
          <Card className="proposal-lift-in border border-yellow-300 bg-white/90 shadow-sm" style={{ '--enter-delay': '280ms' }}>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-700">Coverage</p>
              <p className="mt-1 text-xl font-black text-slate-900">{proposalsInRange} / {proposals.length}</p>
            </CardContent>
          </Card>
        </section>

        <section className="relative pl-4 sm:pl-6">
          <div className="pointer-events-none absolute left-[7px] top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-blue-300 via-violet-300 to-yellow-300" style={{ animation: 'linePulse 2.6s ease-in-out infinite' }} />
          <div className="space-y-5">
            {proposals.length === 0 && (
              <Card className="ml-4 border border-indigo-100 bg-white/92">
                <CardContent className="p-8 text-center">
                  <p className="text-lg font-bold text-slate-800">No proposals received yet</p>
                  <p className="mt-1 text-sm text-slate-600">Once vendors submit offers, they will appear here automatically.</p>
                </CardContent>
              </Card>
            )}
            {paginatedProposals.map((proposal, idx) => (
              <div key={proposal.id} className="proposal-lift-in relative" style={{ '--enter-delay': `${idx * 90 + 340}ms` }}>
                <span className="absolute -left-[2px] top-8 h-5 w-5 rounded-full border-4 border-white bg-blue-500 shadow-[0_0_0_4px_rgba(37,99,235,0.22)]" />
                <Card className="ml-4 overflow-hidden border border-blue-100/80 bg-white/92 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(37,99,235,0.18)]">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{proposal.vendorName}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {proposal.vendorRating}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">{proposal.vendorCompletedJobs} jobs completed</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified
                        </Badge>
                        {proposal.inClientRange ? (
                          <Badge className="proposal-status-glow border border-blue-200 bg-blue-50 text-blue-700">
                            <HandCoins className="mr-1 h-3.5 w-3.5" /> In Client Range
                          </Badge>
                        ) : (
                          <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
                            <CircleAlert className="mr-1 h-3.5 w-3.5" /> Out of Range
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">Vendor Price</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{proposal.proposedBudget}</p>
                      </div>
                      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">Client Deadline</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{clientDeadline}</p>
                      </div>
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-yellow-700">Vendor Delivery</p>
                        <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-900"><CalendarDays className="h-4 w-4" /> {proposal.proposedDeadline}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Proposal Message</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{proposal.message}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button onClick={() => handleAccept(proposal)} className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                        <CheckCircle className="w-4 h-4"/>
                        Accept
                      </Button>

                      <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(proposal.vendorName)}>
                        <X className="w-4 h-4"/>
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {proposals.length > itemsPerPage && (
            <div className="ml-4 mt-4 flex flex-col gap-3 rounded-xl border border-indigo-100 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Page {safeCurrentPage} of {totalPages}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === safeCurrentPage ? 'default' : 'outline'}
                    className={page === safeCurrentPage ? 'bg-[#6f74ea] text-white hover:bg-[#5f64da]' : ''}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* SLA Dialog */}
        <Dialog open={showSLA} onOpenChange={setShowSLA}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Service Level Agreement (SLA)</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">Review the SLA for this service request</p>
            <div className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">Acme Corporation</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="font-medium">{selectedProposal?.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-medium">{selectedProposal?.proposedBudget}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium">{selectedProposal?.proposedDeadline}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Terms & Conditions</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Vendor will complete the work as per the agreed timeline</li>
                  <li>Client will provide necessary access and information</li>
                  <li>Payment will be released upon successful completion</li>
                  <li>7% platform commission will be added to the final amount</li>
                  <li>Both parties agree to maintain professional communication</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => {
            setShowSLA(false);
            toast.success('SLA accepted! Request is now active.');
        }} className="flex-1">
                  Accept SLA
                </Button>
                <Button variant="outline" onClick={() => setShowSLA(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>);
}

