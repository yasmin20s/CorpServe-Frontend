import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, CheckCircle, X, Star, CalendarClock, CalendarDays, HandCoins, ShieldCheck, Sparkles, CircleAlert } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getClientRequestProposalsApi, getProposalCountApi, clientAcceptProposalApi, clientRejectProposalApi } from '../../services/proposalsApi';
import { resolveSlaDialogStatus } from '../../lib/activeRequestBadges';
import { useSignalREvent } from '../../context/SignalRContext';
import { pickProposalCreatedAt, priceInClientBudgetRange, proposedDeliveryMeetsClientDeadline } from '../../lib/proposalFit';
import { formatRequestCreatedAtLabel } from '../../lib/relativeTime';

const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];

export default function Proposals() {
    const { requestId } = useParams();
    const location = useLocation();
    const { user } = useAuth();
    const requestData = location.state?.request || null;
    const itemsPerPage = 4;
    const [showSLA, setShowSLA] = useState(false);
    const [slaData, setSlaData] = useState(null);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [proposals, setProposals] = useState([]);
    const [proposalCount, setProposalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const formatCurrency = (value) => `EGP ${Number(value || 0).toLocaleString()}`;

    const clientBudgetMin = Number(
      requestData?.rawBudgetMin ?? requestData?.budgetMin ?? requestData?.BudgetMin ?? 0,
    );
    const clientBudgetMax = Number(
      requestData?.rawBudgetMax ?? requestData?.budgetMax ?? requestData?.BudgetMax ?? 0,
    );
    const clientDeadline =
      requestData?.rawExpectedDeadline ?? requestData?.expectedDeadline ?? requestData?.ExpectedDeadline ?? '';
    const requestTitle = requestData?.title || `Request ${requestId}`;

    const loadProposals = useCallback(async () => {
      if (!user?.token || !requestId) return;
      setIsLoading(true);
      try {
        const [proposalsResult, countResult] = await Promise.all([
          getClientRequestProposalsApi({ requestId, token: user.token }),
          getProposalCountApi({ requestId, token: user.token }),
        ]);

        const items = Array.isArray(proposalsResult) ? proposalsResult : (proposalsResult?.data || []);
        setProposals(items);
        setProposalCount(typeof countResult === 'number' ? countResult : (countResult?.data ?? items.length));
      } catch (error) {
        toast.error(error.message || 'Failed to load proposals');
        setProposals([]);
      } finally {
        setIsLoading(false);
      }
    }, [user?.token, requestId]);

    useEffect(() => {
      loadProposals();
    }, [loadProposals]);

    useSignalREvent(['New proposal received', 'Proposal accepted', 'Proposal rejected'], loadProposals);

    const visibleProposals = useMemo(
      () =>
        proposals.filter(
          (p) => String(p.proposalStatus ?? p.ProposalStatus ?? '')
            .toLowerCase() !== 'rejected',
        ),
      [proposals],
    );

    const enrichedProposals = useMemo(() => {
      return visibleProposals.map((p, idx) => {
        const price = Number(p.proposedPrice || 0);
        const inClientRange = priceInClientBudgetRange(price, clientBudgetMin, clientBudgetMax);
        const meetsClientDeadline = proposedDeliveryMeetsClientDeadline(
          p.proposedDeadline ?? p.ProposedDeadline,
          clientDeadline,
        );
        const alignsWithRequest = inClientRange && meetsClientDeadline;
        return { ...p, inClientRange, meetsClientDeadline, alignsWithRequest, delay: idx * 70 };
      });
    }, [visibleProposals, clientBudgetMin, clientBudgetMax, clientDeadline]);

    const proposalsInRange = enrichedProposals.filter((p) => p.inClientRange).length;
    const proposalsFullMatch = enrichedProposals.filter((p) => p.alignsWithRequest).length;
    const totalPages = Math.max(1, Math.ceil(enrichedProposals.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedProposals = enrichedProposals.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

    const handleAccept = async (proposal) => {
      if (!user?.token || !proposal?.id) return;
      setActionLoading(proposal.id);
      try {
        const result = await clientAcceptProposalApi({ proposalId: proposal.id, token: user.token });
        setSlaData(result);
        setSelectedProposal(proposal);
        setShowSLA(true);
        toast.success('Proposal accepted! SLA created.');
        await loadProposals();
      } catch (error) {
        toast.error(error.message || 'Failed to accept proposal');
      } finally {
        setActionLoading(null);
      }
    };

    const handleReject = async (proposal) => {
      if (!user?.token || !proposal?.id) return;
      setActionLoading(proposal.id);
      try {
        await clientRejectProposalApi({ proposalId: proposal.id, token: user.token });
        toast.success(`Proposal from ${proposal.vendorName} rejected`);
        await loadProposals();
      } catch (error) {
        toast.error(error.message || 'Failed to reject proposal');
      } finally {
        setActionLoading(null);
      }
    };

    const formatDeadline = (value) => {
      if (!value) return '-';
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
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
                  <Badge className="border border-blue-300 bg-white/80 text-blue-700">{proposalCount} Offers</Badge>
                  <Badge className="border border-yellow-300 bg-yellow-50/90 text-yellow-700">{proposalsInRange} In Budget Range</Badge>
                  <Badge className="border border-emerald-300 bg-emerald-50/90 text-emerald-800">{proposalsFullMatch} Full Match</Badge>
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
              <p className="mt-3 text-center text-xs text-slate-600">Target deadline: <span className="font-bold text-violet-700">{formatDeadline(clientDeadline)}</span></p>
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
              <p className="mt-1 text-xl font-black text-slate-900">{formatDeadline(clientDeadline)}</p>
            </CardContent>
          </Card>
          <Card className="proposal-lift-in border border-yellow-300 bg-white/90 shadow-sm" style={{ '--enter-delay': '280ms' }}>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-700">Coverage</p>
              <p className="mt-1 text-xl font-black text-slate-900">{proposalsFullMatch} full match · {proposalsInRange} in budget</p>
            </CardContent>
          </Card>
        </section>

        <section className="relative pl-4 sm:pl-6">
          <div className="pointer-events-none absolute left-[7px] top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-blue-300 via-violet-300 to-yellow-300" style={{ animation: 'linePulse 2.6s ease-in-out infinite' }} />
          <div className="space-y-5">
            {isLoading && (
              <Card className="ml-4 border border-indigo-100 bg-white/92">
                <CardContent className="p-8 text-center">
                  <p className="text-lg font-bold text-slate-800">Loading proposals...</p>
                </CardContent>
              </Card>
            )}
            {!isLoading && enrichedProposals.length === 0 && (
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
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">
                            {proposal.alignsWithRequest ? 'Accept' : (proposal.proposalType || proposal.ProposalType || 'Proposal')}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">
                            {proposal.proposalStatus}
                          </span>
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          Created from {formatRequestCreatedAtLabel(pickProposalCreatedAt(proposal))}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified
                        </Badge>
                        {proposal.alignsWithRequest ? (
                          <Badge className="proposal-status-glow border border-emerald-200 bg-emerald-50 text-emerald-800">
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Accept-class (budget + deadline)
                          </Badge>
                        ) : proposal.inClientRange ? (
                          <Badge className="proposal-status-glow border border-blue-200 bg-blue-50 text-blue-700">
                            <HandCoins className="mr-1 h-3.5 w-3.5" /> In budget only
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
                        <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(proposal.proposedPrice)}</p>
                      </div>
                      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">Client Deadline</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{formatDeadline(clientDeadline)}</p>
                      </div>
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-yellow-700">Vendor Delivery</p>
                        <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-900"><CalendarDays className="h-4 w-4" /> {formatDeadline(proposal.proposedDeadline)}</p>
                      </div>
                    </div>

                    {proposal.message && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Proposal Message</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{proposal.message}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        onClick={() => handleAccept(proposal)}
                        className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]"
                        disabled={actionLoading === proposal.id}
                      >
                        <CheckCircle className="w-4 h-4"/>
                        {actionLoading === proposal.id ? 'Processing...' : 'Accept'}
                      </Button>

                      <Button
                        variant="outline"
                        className="gap-2 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(proposal)}
                        disabled={actionLoading === proposal.id}
                      >
                        <X className="w-4 h-4"/>
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {enrichedProposals.length > itemsPerPage && (
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
                  <p className="font-medium">{slaData?.clientName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="font-medium">{slaData?.vendorName || selectedProposal?.vendorName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contract Price</p>
                  <p className="font-medium">{slaData ? formatCurrency(slaData.contractPrice) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium">{slaData ? formatDeadline(slaData.deadline) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SLA Status</p>
                  <p className="font-medium">{resolveSlaDialogStatus(slaData)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warning Level</p>
                  <p className="font-medium">{slaData?.warningLevel || '-'}</p>
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
                <Button onClick={() => setShowSLA(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>);
}
