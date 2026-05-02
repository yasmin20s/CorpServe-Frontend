import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import {
  Activity,
  Briefcase,
  CalendarClock,
  CheckCircle,
  Clock3,
  FileStack,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../hooks/useAuth';
import { getVendorSubmittedProposalsApi } from '../../services/proposalsApi';
import { formatRequestCreatedAtLabel } from '../../lib/relativeTime';
import { formatDeadlineDate } from '../../lib/formatDeadlineDate';

const menuItems = [
  { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'My Proposals', path: '/vendor/my-proposals', icon: <FileStack className="w-5 h-5" /> },
  { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5" /> },
  { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

const ITEMS_PER_PAGE = 4;
const HERO_IMAGE = '/pexels-pavel-danilyuk-5520322.jpg';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const value = obj[keys[i]];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function pickClientName(item) {
  const direct = pick(
    item,
    'clientName',
    'ClientName',
    'clientFullName',
    'ClientFullName',
    'clientDisplayName',
    'ClientDisplayName',
    'requestClientName',
    'RequestClientName',
    'createdByName',
    'CreatedByName',
    'ownerName',
    'OwnerName',
    'userName',
    'UserName',
    'fullName',
    'FullName',
  );

  if (direct != null && String(direct).trim()) {
    return String(direct).trim();
  }

  const nested =
    pick(item?.client, 'fullName', 'FullName', 'name', 'Name', 'userName', 'UserName')
    ?? pick(item?.request, 'clientName', 'ClientName', 'clientFullName', 'ClientFullName')
    ?? pick(item?.createdBy, 'fullName', 'FullName', 'name', 'Name', 'userName', 'UserName');

  if (nested != null && String(nested).trim()) {
    return String(nested).trim();
  }

  return 'Client';
}

function formatCurrency(value) {
  return `EGP ${Math.round(Number(value || 0)).toLocaleString()}`;
}

function formatHoursAgo(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatRequestCreatedAtLabel(value);

  const hours = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60)));
  if (hours < 1) return 'Less than 1 hour ago';
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}

function normalizeStatus(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === '1' || value === 'pending') return 'Pending';
  if (value === '2' || value === 'accepted') return 'Accepted';
  if (value === '3' || value === 'rejected') return 'Rejected';
  if (!value) return 'Pending';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function normalizeType(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === '1' || value === 'accept') return 'Accept';
  if (value === '2' || value === 'negotiate') return 'Negotiate';
  if (value === '3' || value === 'reject') return 'Reject';
  if (!value) return '-';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function statusBadgeClass(status) {
  if (status === 'Accepted') return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/35 dark:bg-blue-500/16 dark:text-blue-200';
  if (status === 'Rejected') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/16 dark:text-rose-200';
  return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/35 dark:bg-violet-500/16 dark:text-violet-200';
}

function typeBadgeClass(type) {
  if (type === 'Accept') return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/35 dark:bg-indigo-500/16 dark:text-indigo-200';
  if (type === 'Negotiate') return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/35 dark:bg-violet-500/16 dark:text-violet-200';
  if (type === 'Reject') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/16 dark:text-rose-200';
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200';
}

export default function VendorMyProposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadProposals = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const result = await getVendorSubmittedProposalsApi({
        token: user.token,
        search: searchQuery,
        pageIndex: currentPage,
        pageSize: ITEMS_PER_PAGE,
      });

      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.Data)
            ? result.Data
            : [];

      const mapped = rows.map((item, index) => {
        const createdAt = pick(item, 'createdAt', 'CreatedAt', 'proposalCreatedAt', 'ProposalCreatedAt');
        const proposalStatus = normalizeStatus(pick(item, 'proposalStatus', 'ProposalStatus', 'status', 'Status'));
        const proposalType = normalizeType(pick(item, 'proposalType', 'ProposalType', 'type', 'Type'));

        return {
          id: String(pick(item, 'id', 'Id', 'proposalId', 'ProposalId') ?? `fallback-${index}`),
          requestTitle: String(pick(item, 'requestTitle', 'RequestTitle', 'title', 'Title') ?? '-'),
          clientId: String(pick(item, 'clientId', 'ClientId') ?? pick(item?.request, 'clientId', 'ClientId') ?? ''),
          clientName: pickClientName(item),
          clientProfilePictureUrl: pick(item, 'clientProfilePictureUrl', 'ClientProfilePictureUrl') ?? '',
          proposalStatus,
          proposalType,
          proposedPrice: Number(pick(item, 'proposedPrice', 'ProposedPrice', 'price', 'Price') ?? 0),
          proposedDeadline: pick(item, 'proposedDeadline', 'ProposedDeadline', 'deadline', 'Deadline') ?? '',
          message: String(pick(item, 'message', 'Message') ?? ''),
          createdAt,
          createdAgo: formatHoursAgo(createdAt),
          createdReadable: formatRequestCreatedAtLabel(createdAt),
        };
      });

      setProposals(mapped);
      setTotalCount(Number(pick(result, 'count', 'Count')) || mapped.length);
    } catch (error) {
      toast.error(error.message || 'Failed to load submitted proposals');
      setProposals([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, searchQuery, currentPage]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const statusPass = statusFilter === 'all' || proposal.proposalStatus.toLowerCase() === statusFilter;
      const typePass = typeFilter === 'all' || proposal.proposalType.toLowerCase() === typeFilter;
      return statusPass && typePass;
    });
  }, [proposals, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const stats = proposals.reduce(
      (acc, proposal) => {
        if (proposal.proposalStatus === 'Accepted') acc.accepted += 1;
        if (proposal.proposalStatus === 'Pending') acc.pending += 1;
        if (proposal.proposalStatus === 'Rejected') acc.rejected += 1;
        return acc;
      },
      { accepted: 0, pending: 0, rejected: 0 },
    );

    const acceptanceRate = proposals.length ? Math.round((stats.accepted / proposals.length) * 100) : 0;
    return {
      total: totalCount,
      accepted: stats.accepted,
      pending: stats.pending,
      rejected: stats.rejected,
      acceptanceRate,
    };
  }, [proposals, totalCount]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const heroStats = [
    {
      label: 'Submitted',
      value: String(summary.total),
      icon: FileStack,
      iconClass: 'text-indigo-700 [stroke-width:2.4] dark:text-indigo-200',
      iconBgClass: 'bg-indigo-100 ring-indigo-200 dark:bg-indigo-500/22 dark:ring-indigo-400/35',
    },
    {
      label: 'Accepted',
      value: String(summary.accepted),
      icon: CheckCircle,
      iconClass: 'text-blue-700 [stroke-width:2.4] dark:text-blue-200',
      iconBgClass: 'bg-blue-100 ring-blue-200 dark:bg-blue-500/22 dark:ring-blue-400/35',
    },
    {
      label: 'Pending',
      value: String(summary.pending),
      icon: Clock3,
      iconClass: 'text-violet-700 [stroke-width:2.4] dark:text-violet-200',
      iconBgClass: 'bg-violet-100 ring-violet-200 dark:bg-violet-500/22 dark:ring-violet-400/35',
    },
    {
      label: 'Rate',
      value: `${summary.acceptanceRate}%`,
      icon: TrendingUp,
      iconClass: 'text-cyan-700 [stroke-width:2.4] dark:text-cyan-200',
      iconBgClass: 'bg-cyan-100 ring-cyan-200 dark:bg-cyan-500/22 dark:ring-cyan-400/35',
    },
  ];

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6 lg:space-y-8">
        <section className="relative overflow-hidden rounded-[30px] border border-indigo-200/70 bg-gradient-to-br from-indigo-100 via-violet-100 to-blue-100 p-4 shadow-[0_18px_42px_rgba(79,70,229,0.2)] sm:p-6 lg:p-8 dark:border-indigo-400/30 dark:bg-gradient-to-br dark:from-[#131d37] dark:via-[#1a2a4d] dark:to-[#1e3a62] dark:shadow-[0_20px_44px_rgba(2,6,23,0.58)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />
          <motion.div
            className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-indigo-300/35 blur-3xl dark:bg-indigo-500/18"
            animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-12 bottom-2 h-56 w-56 rounded-full bg-blue-300/35 blur-3xl dark:bg-sky-500/16"
            animate={{ x: [0, -16, 0], y: [0, 10, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-4">
              <Badge className="w-fit border border-indigo-300 bg-white/85 text-indigo-700 dark:border-indigo-400/35 dark:bg-slate-900/80 dark:text-indigo-200">
                <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-500/22 dark:ring-amber-400/35">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 [stroke-width:2.4] dark:text-amber-200" />
                </span>
                Vendor Pitch Board
              </Badge>
              <h1 className="text-3xl font-black leading-tight text-indigo-950 lg:text-4xl dark:text-indigo-100">View My Proposals</h1>
              <p className="max-w-2xl text-sm text-indigo-800/85 sm:text-base dark:text-indigo-200/85">
                A visual command center for every proposal you submitted, with pricing, deadlines, client context, and status in one focused view.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {heroStats.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08, duration: 0.35 }}
                      className="rounded-xl border border-indigo-200/80 bg-white/75 px-3 py-2 shadow-sm dark:border-indigo-400/30 dark:bg-slate-900/80 dark:shadow-none"
                    >
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ${item.iconBgClass}`}>
                          <Icon className={`h-3.5 w-3.5 ${item.iconClass}`} />
                        </span>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-base font-black text-indigo-950 dark:text-indigo-100">{item.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-[#2f215f]/66 via-[#4a53be]/56 to-[#1b3f8f]/66 p-2 shadow-[0_16px_38px_rgba(79,70,229,0.29)] backdrop-blur-sm dark:border-indigo-300/20 dark:shadow-[0_20px_40px_rgba(2,6,23,0.58)]">
                <div className="relative">
                  <img src={HERO_IMAGE} alt="Vendor collaboration" className="h-48 w-full rounded-2xl object-cover sm:h-60" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/20" />
                </div>
                <div className="mt-3 rounded-2xl border border-white/30 bg-white/5 px-4 py-3 dark:bg-slate-900/35">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white">Momentum Line</p>
                  <p className="mt-1 text-sm font-semibold text-white/95">Pitch clearly, follow up quickly, and keep your win-rate climbing.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-200/70 bg-white/95 p-4 shadow-[0_10px_26px_rgba(79,70,229,0.1)] dark:border-indigo-400/30 dark:bg-slate-900/85 dark:shadow-none">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-fuchsia-100 ring-1 ring-fuchsia-200 dark:bg-fuchsia-500/20 dark:ring-fuchsia-400/35">
                <Search className="h-3.5 w-3.5 text-fuchsia-700 [stroke-width:2.4] dark:text-fuchsia-200" />
              </span>
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by request title, client, or message"
                className="border-indigo-200 pl-9 dark:border-indigo-400/30 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-indigo-200 dark:border-indigo-400/30 dark:bg-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Proposal Status" />
              </SelectTrigger>
              <SelectContent className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-indigo-200 dark:border-indigo-400/30 dark:bg-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Proposal Type" />
              </SelectTrigger>
              <SelectContent className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="accept">Accept</SelectItem>
                <SelectItem value="negotiate">Negotiate</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-indigo-200 bg-white/90 dark:border-indigo-400/30 dark:bg-slate-900/85">
            <CardContent className="p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-200 dark:bg-indigo-500/20 dark:ring-indigo-400/35">
                  <FileStack className="h-3.5 w-3.5 text-indigo-700 [stroke-width:2.4] dark:text-indigo-200" />
                </span>
                Total Proposals
              </p>
              <p className="mt-1 text-2xl font-black text-indigo-900 dark:text-indigo-100">{summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border border-violet-200 bg-white/90 dark:border-violet-400/30 dark:bg-slate-900/85">
            <CardContent className="p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:ring-violet-400/35">
                  <Clock3 className="h-3.5 w-3.5 text-violet-700 [stroke-width:2.4] dark:text-violet-200" />
                </span>
                Pending Review
              </p>
              <p className="mt-1 text-2xl font-black text-violet-900 dark:text-violet-100">{summary.pending}</p>
            </CardContent>
          </Card>
          <Card className="border border-blue-200 bg-white/90 dark:border-blue-400/30 dark:bg-slate-900/85">
            <CardContent className="p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:ring-blue-400/35">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-700 [stroke-width:2.4] dark:text-blue-200" />
                </span>
                Accepted
              </p>
              <p className="mt-1 text-2xl font-black text-blue-900 dark:text-blue-100">{summary.accepted}</p>
            </CardContent>
          </Card>
          <Card className="border border-indigo-200 bg-indigo-50/45 dark:border-indigo-400/30 dark:bg-indigo-500/16">
            <CardContent className="p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 ring-1 ring-cyan-200 dark:bg-cyan-500/20 dark:ring-cyan-400/35">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-700 [stroke-width:2.4] dark:text-cyan-200" />
                </span>
                Acceptance Rate
              </p>
              <p className="mt-1 text-2xl font-black text-indigo-900 dark:text-indigo-100">{summary.acceptanceRate}%</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          {isLoading && (
            <Card className="border border-indigo-200/70 bg-white/90 dark:border-indigo-400/30 dark:bg-slate-900/85">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Loading proposals...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && filteredProposals.length === 0 && (
            <Card className="border border-indigo-200/70 bg-white/90 dark:border-indigo-400/30 dark:bg-slate-900/85">
              <CardContent className="p-6 text-center sm:p-8">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">No proposals found</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Try a different search or filter combination.</p>
              </CardContent>
            </Card>
          )}

          {filteredProposals.map((proposal, index) => (
            <motion.article
              key={proposal.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="animate-in fade-in slide-in-from-bottom-2"
            >
              <Card className="group overflow-hidden border border-indigo-200/80 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(79,70,229,0.16)] dark:border-indigo-300/35 dark:bg-slate-800/78 dark:shadow-none dark:hover:shadow-none">
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-100 ring-1 ring-fuchsia-200 dark:bg-fuchsia-500/20 dark:ring-fuchsia-400/35">
                          <Briefcase className="h-3.5 w-3.5 text-fuchsia-700 [stroke-width:2.4] dark:text-fuchsia-200" />
                        </span>
                        Proposal Opportunity
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">{proposal.requestTitle}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-slate-500 dark:text-slate-400">Client:</span>
                        <UserAvatar
                          userId={proposal.clientId}
                          name={proposal.clientName}
                          profilePictureUrl={proposal.clientProfilePictureUrl}
                          size="sm"
                          linkClassName="max-w-[min(100%,260px)]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`border ${statusBadgeClass(proposal.proposalStatus)}`}>
                        {proposal.proposalStatus}
                      </Badge>
                      <Badge className={`border ${typeBadgeClass(proposal.proposalType)}`}>
                        {proposal.proposalType}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-300/40 dark:bg-indigo-400/22">
                      <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-200">Proposal Price</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-semibold text-indigo-900 dark:text-indigo-100">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:ring-emerald-400/35">
                          <Wallet className="h-3.5 w-3.5 text-emerald-700 [stroke-width:2.4] dark:text-emerald-200" />
                        </span>
                        {formatCurrency(proposal.proposedPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-300/40 dark:bg-violet-400/22">
                      <p className="text-xs uppercase tracking-wide text-violet-700 dark:text-violet-200">Deadline</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-semibold text-violet-900 dark:text-violet-100">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:ring-violet-400/35">
                          <CalendarClock className="h-3.5 w-3.5 text-violet-700 [stroke-width:2.4] dark:text-violet-200" />
                        </span>
                        {formatDeadlineDate(proposal.proposedDeadline)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-300/40 dark:bg-blue-400/22">
                      <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-200">Created</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-semibold text-blue-900 dark:text-blue-100">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 ring-1 ring-cyan-200 dark:bg-cyan-500/20 dark:ring-cyan-400/35">
                          <Clock3 className="h-3.5 w-3.5 text-cyan-700 [stroke-width:2.4] dark:text-cyan-200" />
                        </span>
                        {proposal.createdAgo}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800/58">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Timeline Label</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{proposal.createdReadable}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/45 p-3 dark:border-indigo-300/40 dark:bg-indigo-400/20">
                    <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-200 dark:bg-indigo-500/20 dark:ring-indigo-400/35">
                        <MessageSquareText className="h-3.5 w-3.5 text-indigo-700 [stroke-width:2.4] dark:text-indigo-200" />
                      </span>
                      Proposal Message
                    </p>
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{proposal.message || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.article>
          ))}

          {!isLoading && filteredProposals.length > 0 && totalCount > ITEMS_PER_PAGE && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-indigo-200/80 bg-white/95 p-3 dark:border-indigo-400/30 dark:bg-slate-900/85">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-400/35 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-500/18 dark:hover:text-indigo-100"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, itemIndex) => itemIndex + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === safeCurrentPage ? 'default' : 'outline'}
                    className={
                      page === safeCurrentPage
                        ? 'bg-[#6f74ea] text-white hover:bg-[#5f64da]'
                        : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-400/35 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-500/18 dark:hover:text-indigo-100'
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-400/35 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-500/18 dark:hover:text-indigo-100"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
