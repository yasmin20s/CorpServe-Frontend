import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import DarkVeil from '../../components/backgrounds/DarkVeil';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  TrendingUp,
  Eye,
  CheckSquare,
  X,
  Building2,
  Wallet,
  CalendarClock,
  ArrowRight,
  Sparkles,
  FileText,
  UserRound,
  Tag,
  Info,
  Search,
  FileStack,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getVendorRequestsApi } from '../../services/vendorRequestsApi';
import { vendorAcceptProposalApi, vendorNegotiateProposalApi, vendorRejectProposalApi } from '../../services/proposalsApi';
import { useSignalREvent } from '../../context/SignalRContext';
import { normalizeRequestDocuments, toAbsoluteFileUrl } from '../../lib/requestDocuments';
import {
  pickVendorRequestBudget,
  pickVendorRequestCreatedAt,
  pickVendorRequestDeadline,
  priceInClientBudgetRange,
  proposedDeliveryMeetsClientDeadline,
} from '../../lib/proposalFit';
import { formatRequestCreatedAtLabel } from '../../lib/relativeTime';

const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'My Proposals', path: '/vendor/my-proposals', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];

const ITEMS_PER_PAGE = 5;

const heroIconTiles = [
  { label: 'Corporate', icon: Building2 },
  { label: 'Quick Scope', icon: CalendarClock },
  { label: 'High Value', icon: TrendingUp },
  { label: 'Open Requests', icon: Briefcase },
];

const proposalSteps = [
  'Review scope',
  'Set budget & timeline',
  'Write your approach',
  'Submit proposal',
];

function formatCurrency(value) {
  return `EGP ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function vendorRequestPostedLabel(request) {
  return formatRequestCreatedAtLabel(pickVendorRequestCreatedAt(request));
}

function RequestAttachmentsBlock({ request, className = '' }) {
  const docs = normalizeRequestDocuments(request, request.requestId);
  if (!docs.length) return null;
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/80 p-3 ${className}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Client documents</p>
      <ul className="flex flex-col gap-1.5">
        {docs.map((doc) => (
          <li key={doc.id}>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-left text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
              onClick={() => window.open(toAbsoluteFileUrl(doc.url), '_blank', 'noopener,noreferrer')}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {doc.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AvailableRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [proposal, setProposal] = useState({ budget: '', deadline: '', message: '' });
  const [submittingForId, setSubmittingForId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);

  const loadRequests = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const result = await getVendorRequestsApi({
        token: user.token,
        search: searchQuery,
        pageIndex: currentPage,
        pageSize: ITEMS_PER_PAGE,
      });
      const items = Array.isArray(result?.data) ? result.data : [];
      setRequests(items);
      setTotalCount(result?.count || 0);
    } catch (error) {
      toast.error(error.message || 'Failed to load requests');
      setRequests([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, searchQuery, currentPage]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useSignalREvent(['New request available', 'Request updated', 'Request deleted'], loadRequests);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const handleSubmitProposal = async (request) => {
    if (!user?.token) return;
    if (!proposal.budget || !proposal.deadline) {
      toast.error('Please enter proposed price and deadline');
      return;
    }

    const proposedPrice = Number(proposal.budget);
    if (Number.isNaN(proposedPrice) || proposedPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSubmittingForId(request.requestId);
    try {
      const payload = {
        requestId: request.requestId,
        proposedPrice,
        proposedDeadline: new Date(proposal.deadline).toISOString(),
        message: proposal.message || undefined,
        token: user.token,
      };

      const { min: clientBudgetMin, max: clientBudgetMax } = pickVendorRequestBudget(request);
      const clientDeadline = pickVendorRequestDeadline(request);
      const fitsStraightAccept =
        priceInClientBudgetRange(proposedPrice, clientBudgetMin, clientBudgetMax)
        && proposedDeliveryMeetsClientDeadline(proposal.deadline, clientDeadline);

      if (fitsStraightAccept) {
        await vendorAcceptProposalApi(payload);
        toast.success('Proposal submitted as Accept — within budget and by your deadline.');
      } else {
        await vendorNegotiateProposalApi(payload);
        toast.success('Proposal submitted as Negotiate — adjust price or deadline to match the request for a direct accept.');
      }

      setProposal({ budget: '', deadline: '', message: '' });
      await loadRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to submit proposal');
    } finally {
      setSubmittingForId(null);
    }
  };

  const handleDeclineRequest = async (request) => {
    if (!user?.token) return;
    setDecliningId(request.requestId);
    try {
      await vendorRejectProposalApi({
        requestId: request.requestId,
        message: 'Vendor declined the request.',
        token: user.token,
      });
      toast.info('Request declined', {
        description: `You declined "${request.title}". You can still review other opportunities.`,
      });
      setRequests((prev) => prev.filter((r) => r.requestId !== request.requestId));
      await loadRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to decline request');
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6 lg:space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-800 via-indigo-700 to-blue-700 p-4 text-white sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0">
            <DarkVeil hueShift={0} noiseIntensity={0} scanlineIntensity={0} speed={3} scanlineFrequency={0} warpAmount={0} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-900/55 via-indigo-900/50 to-blue-900/55" />
          <motion.div
            className="pointer-events-none absolute -left-20 top-6 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, 14, 0], scale: [1, 1.07, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
            animate={{ x: [0, -22, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-4">
              <Badge className="w-fit border border-violet-200/40 bg-violet-200/10 text-violet-100">Vendor Opportunity Hub</Badge>
              <h1 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Win better contracts with fast, polished proposals
              </h1>
              <p className="max-w-xl text-sm text-slate-200 sm:text-base">
                Explore open service requests from verified companies, spot urgent opportunities, and submit proposals in minutes.
              </p>
            </motion.div>
            <motion.div className="relative" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="grid grid-cols-2 gap-3">
                {heroIconTiles.map((tile, index) => {
                  const Icon = tile.icon;
                  return (
                    <motion.div
                      key={tile.label}
                      className="flex items-center gap-2 rounded-xl border border-violet-200/40 bg-white/5 px-3 py-2 text-xs text-slate-100 backdrop-blur sm:text-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.1 }}
                    >
                      <motion.span
                        animate={{ scale: [1, 1.16, 1], rotate: [0, 6, 0] }}
                        transition={{ duration: 2 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-flex h-7 w-7 items-center justify-center border border-violet-200/40 bg-gradient-to-br from-violet-400/30 via-blue-300/25 to-indigo-300/30 [clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)]"
                      >
                        <Icon className="h-4 w-4 text-violet-100" />
                      </motion.span>
                      {tile.label}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-200/70 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              className="border-indigo-200 pl-9"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={() => navigate('/vendor/my-proposals')}
            >
              <FileStack className="h-4 w-4" />
              View My Proposals
            </Button>
            <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
              <Badge className="w-fit gap-2 border border-violet-300 bg-gradient-to-r from-violet-100 to-blue-100 px-4 py-1.5 text-sm font-semibold text-violet-800 shadow-sm sm:text-base">
                <Briefcase className="h-4 w-4" />
                {totalCount} Available Requests
              </Badge>
            </motion.div>
          </div>

          {isLoading && (
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-semibold text-slate-800">Loading requests...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && requests.length === 0 && (
            <Card className="border border-slate-200 bg-slate-50/70">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-bold text-slate-800">No available requests</p>
                <p className="mt-1 text-sm text-slate-600">New requests from clients will appear here automatically.</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:gap-5">
            {requests.map((request, index) => (
              <motion.div
                key={request.requestId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-2 border-violet-200 bg-white shadow-sm">
                  <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-blue-500" />
                  <CardHeader className="pb-0">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold text-slate-900">{request.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-cyan-600" />
                            {request.clientName}
                          </span>
                          <span className="text-slate-300">-</span>
                          <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                            {request.requestCategory}
                          </Badge>
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          Posted {vendorRequestPostedLabel(request)}
                        </p>
                      </div>
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        High Match Potential
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-slate-700 sm:text-base">{request.description}</p>
                    <RequestAttachmentsBlock request={request} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Budget range</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          {formatCurrency(request.budgetMin)} - {formatCurrency(request.budgetMax)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Deadline</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <CalendarClock className="h-4 w-4 text-amber-600" />
                          {formatDate(request.deadline)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="group gap-2 border-0 bg-[linear-gradient(100deg,#7c3aed_0%,#4f46e5_45%,#2563eb_100%)] text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.9)] hover:brightness-110">
                            <motion.span animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                              <CheckSquare className="h-4 w-4"/>
                            </motion.span>
                            Submit Proposal
                            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                              <ArrowRight className="h-4 w-4" />
                            </motion.span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 shadow-[0_24px_80px_-35px_rgba(76,29,149,0.65)] backdrop-blur-md sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl text-slate-900">Submit Proposal</DialogTitle>
                          </DialogHeader>
                          <div className="relative space-y-5 py-2">
                            <div className="rounded-xl border border-violet-200/70 bg-white/70 p-3 backdrop-blur">
                              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-violet-700">Proposal Flow</p>
                              <div className="grid gap-2 sm:grid-cols-4">
                                {proposalSteps.map((step, stepIndex) => (
                                  <motion.div
                                    key={step}
                                    className="flex items-center gap-2 rounded-lg border border-violet-100/80 bg-white/70 px-2 py-2"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 + stepIndex * 0.08 }}
                                  >
                                    <motion.span
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-[11px] font-semibold text-white"
                                      animate={{ scale: [1, 1.15, 1] }}
                                      transition={{ duration: 1.9 + stepIndex * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                      {stepIndex + 1}
                                    </motion.span>
                                    <span className="text-[11px] font-medium leading-4 text-slate-700">{step}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-violet-200 bg-white/80 p-4">
                              <p className="text-sm font-semibold text-slate-900">{request.title}</p>
                              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                Posted {vendorRequestPostedLabel(request)}
                              </p>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <UserRound className="h-4 w-4 text-violet-600" />
                                  {request.clientName}
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <Tag className="h-4 w-4 text-blue-600" />
                                  {request.requestCategory}
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <Wallet className="h-4 w-4 text-emerald-600" />
                                  {formatCurrency(request.budgetMin)} - {formatCurrency(request.budgetMax)}
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <CalendarClock className="h-4 w-4 text-amber-600" />
                                  Deadline: {formatDate(request.deadline)}
                                </div>
                              </div>
                            </div>
                            <RequestAttachmentsBlock request={request} className="bg-white/80" />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Proposed Price</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter amount"
                                  value={proposal.budget}
                                  onChange={(e) => setProposal({ ...proposal, budget: e.target.value })}
                                  className="border-violet-200 bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Proposed Deadline</Label>
                                <Input
                                  type="date"
                                  value={proposal.deadline}
                                  onChange={(e) => setProposal({ ...proposal, deadline: e.target.value })}
                                  className="border-violet-200 bg-white"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Proposal Message</Label>
                              <Textarea
                                rows={5}
                                placeholder="Describe your approach, timeline, and key deliverables..."
                                value={proposal.message}
                                onChange={(e) => setProposal({ ...proposal, message: e.target.value })}
                                className="border-violet-200 bg-white"
                              />
                            </div>
                            <Button
                              onClick={() => handleSubmitProposal(request)}
                              disabled={submittingForId === request.requestId}
                              className="w-full border-0 bg-[linear-gradient(100deg,#7c3aed_0%,#4f46e5_45%,#2563eb_100%)] text-white hover:brightness-110"
                            >
                              {submittingForId === request.requestId ? 'Submitting...' : 'Submit Proposal'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2 border-slate-300 text-slate-700">
                            <motion.span animate={{ rotate: [0, 8, 0] }} transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}>
                              <Eye className="h-4 w-4"/>
                            </motion.span>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white via-violet-50/40 to-blue-50/60 shadow-[0_24px_80px_-35px_rgba(37,99,235,0.45)] backdrop-blur sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="bg-gradient-to-r from-violet-700 to-black bg-clip-text text-xl text-transparent">Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="relative space-y-4 py-2">
                            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-4">
                              <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                              <p className="mt-1 text-sm text-slate-600">
                                Posted {vendorRequestPostedLabel(request)}
                              </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <UserRound className="h-4 w-4 text-violet-600" />
                                Client: {request.clientName}
                              </div>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <Tag className="h-4 w-4 text-blue-600" />
                                Category: {request.requestCategory}
                              </div>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <Wallet className="h-4 w-4 text-emerald-600" />
                                Budget: {formatCurrency(request.budgetMin)} - {formatCurrency(request.budgetMax)}
                              </div>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <CalendarClock className="h-4 w-4 text-amber-600" />
                                Deadline: {formatDate(request.deadline)}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-800">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                Full Description
                              </p>
                              <p className="text-sm leading-6 text-slate-600">{request.description}</p>
                            </div>
                            <RequestAttachmentsBlock request={request} />
                            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-sm text-slate-700">
                              <p className="inline-flex items-center gap-1 font-medium text-slate-800">
                                <Info className="h-4 w-4 text-violet-600" />
                                Tip
                              </p>
                              <p className="mt-1">Tailor your proposal to this scope and include milestones to increase your win chance.</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50" disabled={decliningId === request.requestId}>
                            <motion.span animate={{ rotate: [0, -10, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
                              <X className="h-4 w-4"/>
                            </motion.span>
                            {decliningId === request.requestId ? 'Declining...' : 'Decline'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You are about to decline "{request.title}" from {request.clientName}. This action will dismiss it from your current opportunities list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDeclineRequest(request)}
                            >
                              Yes, Decline
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Page {safeCurrentPage} of {totalPages}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}>Previous</Button>
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
                <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
