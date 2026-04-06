import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Slider } from '../../components/ui/slider';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  TrendingUp,
  FileText,
  AlertTriangle,
  CalendarClock,
  Wallet,
  UserRound,
  Clock3,
  Sparkles,
  CheckSquare,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { getVendorRequestsUiStore, updateVendorRequestsUiStore } from '../../lib/vendorRequestsUiStore';

const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];

const HOURS_72_MS = 72 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const ITEMS_PER_PAGE = 3;

const badgeClassByLabel = {
  'In Progress': 'border-violet-200 bg-violet-50 text-violet-700',
  Delayed: 'border-red-200 bg-red-50 text-red-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On Track': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Warning: 'border-amber-200 bg-amber-50 text-amber-700',
  Blocked: 'border-rose-200 bg-rose-50 text-rose-700',
};

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB');
}

function parsePrice(value) {
  const parsed = Number(String(value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value) {
  return `EGP ${Math.round(value).toLocaleString()}`;
}

function resolveSlaUiMeta(request) {
  const now = Date.now();
  const deadlineTs = new Date(request.deadline).getTime();
  const diff = deadlineTs - now;

  if (request.slaStatus === 'Completed') {
    return {
      taskStateLabel: 'Completed',
      uiLabel: 'Completed',
      remainingLabel: 'Completed',
    };
  }

  if (request.slaStatus === 'Delayed') {
    if (request.suspendedBy === 'client' || request.suspendedBy === 'vendor') {
      return {
        taskStateLabel: 'Delayed',
        uiLabel: 'Blocked',
        remainingLabel: `Blocked (${request.suspendedBy} suspended)`,
      };
    }

    const overdueDays = Math.max(1, Math.ceil(Math.abs(diff) / DAY_MS));
    return {
      taskStateLabel: 'Delayed',
      uiLabel: 'Delayed',
      remainingLabel: diff <= 0 ? `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}` : 'Delayed',
    };
  }

  if (diff > HOURS_72_MS) {
    const days = Math.ceil(diff / DAY_MS);
    return {
      taskStateLabel: 'In Progress',
      uiLabel: 'On Track',
      remainingLabel: `${days} day${days === 1 ? '' : 's'} left`,
    };
  }

  if (diff > 0) {
    const hours = Math.max(1, Math.ceil(diff / HOUR_MS));
    return {
      taskStateLabel: 'In Progress',
      uiLabel: 'Warning',
      remainingLabel: `${hours} hour${hours === 1 ? '' : 's'} left`,
    };
  }

  return {
    taskStateLabel: 'In Progress',
    uiLabel: 'Warning',
    remainingLabel: 'Deadline reached',
  };
}

export default function VendorActiveRequests() {
    const [activeRequests, setActiveRequests] = useState([]);
    const [progressRequestId, setProgressRequestId] = useState(null);
    const [slaRequestId, setSlaRequestId] = useState(null);
    const [progressValue, setProgressValue] = useState(0);
    const [workUpdate, setWorkUpdate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskStateFilter, setTaskStateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
      const store = getVendorRequestsUiStore();
      setActiveRequests(store.activeRequests);
    }, []);

    const selectedProgressRequest = useMemo(
      () => activeRequests.find((request) => request.id === progressRequestId) || null,
      [activeRequests, progressRequestId]
    );

    const selectedSlaRequest = useMemo(
      () => activeRequests.find((request) => request.id === slaRequestId) || null,
      [activeRequests, slaRequestId]
    );

    const requestsWithMeta = useMemo(
      () => activeRequests.map((request) => ({ ...request, uiMeta: resolveSlaUiMeta(request) })),
      [activeRequests]
    );

    const filteredRequests = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();

      return requestsWithMeta.filter((request) => {
        if (query) {
          const haystack = `${request.title} ${request.client} ${request.description}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (statusFilter !== 'all' && request.uiMeta.uiLabel !== statusFilter) return false;
        if (taskStateFilter !== 'all' && request.uiMeta.taskStateLabel !== taskStateFilter) return false;

        return true;
      });
    }, [requestsWithMeta, searchQuery, statusFilter, taskStateFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRequests = useMemo(() => {
      const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
      return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredRequests, safeCurrentPage]);

    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, statusFilter, taskStateFilter]);

    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [currentPage, totalPages]);

    const handleOpenProgressDialog = (request) => {
      setProgressRequestId(request.id);
      setProgressValue(Number(request.progress || 0));
      setWorkUpdate('');
    };

    const handleSaveProgress = () => {
      if (!selectedProgressRequest) return;

      const cleanedUpdate = workUpdate.trim();

      const nextStore = updateVendorRequestsUiStore((draft) => {
        draft.activeRequests = draft.activeRequests.map((request) =>
          request.id === selectedProgressRequest.id
            ? {
                ...request,
                progress: progressValue,
                lastUpdate: cleanedUpdate || request.lastUpdate,
              }
            : request
        );

        return draft;
      });

      setActiveRequests(nextStore.activeRequests);
      toast.success('Progress updated successfully.');
    };

    const handleMarkAsCompleted = () => {
      if (!selectedProgressRequest) return;

      const completedItem = {
        id: selectedProgressRequest.id,
        title: selectedProgressRequest.title,
        client: selectedProgressRequest.client,
        amount: selectedProgressRequest.budget,
        completedDate: new Date().toISOString().slice(0, 10),
        rating: 5,
        feedback: 'Marked as completed from active requests progress update.',
      };

      const nextStore = updateVendorRequestsUiStore((draft) => {
        draft.activeRequests = draft.activeRequests.filter((request) => request.id !== selectedProgressRequest.id);
        draft.completedRequests = [completedItem, ...draft.completedRequests];
        return draft;
      });

      setActiveRequests(nextStore.activeRequests);
      setProgressRequestId(null);
      setWorkUpdate('');
      setProgressValue(0);

      toast.success('Request completed and moved to Completed Requests.');
    };

    return (
      <DashboardLayout menuItems={menuItems} userRole="vendor">
        <div className="space-y-6 lg:space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-r from-violet-100 via-indigo-100 to-blue-100 p-6 shadow-[0_16px_36px_rgba(79,70,229,0.18)] lg:p-8">
            <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-violet-300/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-blue-300/40 blur-3xl" />

            <div className="relative z-10 space-y-4">
              <h1 className="text-3xl font-black text-indigo-950 lg:text-4xl">Vendor Active Requests</h1>
              <p className="max-w-3xl text-indigo-800/85">
                Track all ongoing tasks, maintain SLA commitments, and submit progress updates with clear status visibility.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-200/70 bg-white p-4 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <SlidersHorizontal className="h-4 w-4" />
              Search & Filter
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, client, or description"
                  className="border-indigo-200 pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="SLA Label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA Labels</SelectItem>
                  <SelectItem value="On Track">On Track</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={taskStateFilter} onValueChange={setTaskStateFilter}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Task State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Task States</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            {activeRequests.length === 0 && (
              <Card className="border border-emerald-200 bg-emerald-50/60">
                <CardContent className="flex flex-col items-start gap-3 p-6">
                  <Badge className="border border-emerald-200 bg-white text-emerald-700">All Done</Badge>
                  <p className="text-lg font-semibold text-emerald-900">No active requests right now.</p>
                  <p className="text-sm text-emerald-800/80">All tracked requests have been moved to Completed.</p>
                </CardContent>
              </Card>
            )}

            {activeRequests.length > 0 && filteredRequests.length === 0 && (
              <Card className="border border-slate-200 bg-slate-50/70">
                <CardContent className="flex flex-col items-start gap-3 p-6">
                  <p className="text-lg font-semibold text-slate-800">No requests match current filters.</p>
                  <p className="text-sm text-slate-600">Try changing search keywords or reset filters.</p>
                  <Button
                    variant="outline"
                    className="border-[#6f74ea] text-[#5f64da] hover:bg-indigo-50"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setTaskStateFilter('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {paginatedRequests.map((request) => {
              const meta = request.uiMeta;

              return (
                <Card key={request.id} className="overflow-hidden border border-violet-200/80 bg-white shadow-sm">
                  <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />

                  <CardHeader className="pb-0">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl text-slate-900">{request.title}</CardTitle>
                        <p className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <UserRound className="h-4 w-4 text-violet-600" />
                          Client: {request.client}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`border ${badgeClassByLabel[meta.taskStateLabel] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          Task State: {meta.taskStateLabel}
                        </Badge>
                        <Badge className={`border ${badgeClassByLabel[meta.uiLabel] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          SLA: {meta.uiLabel}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request Description</p>
                      <p className="mt-1 text-sm text-slate-700">{request.description}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Task Price</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          {request.budget}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Deadline</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <CalendarClock className="h-4 w-4 text-indigo-600" />
                          {formatDate(request.deadline)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Remaining</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <Clock3 className="h-4 w-4 text-amber-600" />
                          {meta.remainingLabel}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Current Progress</p>
                        <p className="font-semibold text-slate-900">{request.progress}%</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-violet-200/70 bg-violet-50/50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          Latest Work Update
                        </p>
                        <span className="text-xs font-semibold text-violet-700">{request.progress}%</span>
                      </div>
                      <Progress
                        value={request.progress}
                        className="h-2.5 bg-violet-100"
                        indicatorClassName="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]"
                        onClick={() => handleOpenProgressDialog(request)}
                      >
                        <CheckSquare className="h-4 w-4" />
                        Update Progress
                      </Button>

                      <Button
                        variant="outline"
                        className="gap-2 border-[#6f74ea] text-[#5f64da] hover:bg-indigo-50"
                        onClick={() => setSlaRequestId(request.id)}
                      >
                        <FileText className="h-4 w-4" />
                        View SLA
                      </Button>

                      {meta.uiLabel === 'Warning' && (
                        <div className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          Deadline is near
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredRequests.length > ITEMS_PER_PAGE && (
              <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">Page {safeCurrentPage} of {totalPages}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === safeCurrentPage ? 'default' : 'outline'}
                      className={page === safeCurrentPage ? 'bg-[#6f74ea] text-white hover:bg-[#5f64da]' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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

        <Dialog open={Boolean(selectedProgressRequest)} onOpenChange={(open) => !open && setProgressRequestId(null)}>
          <DialogContent className="max-h-[88dvh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900">Update Progress</DialogTitle>
            </DialogHeader>

            {selectedProgressRequest && (
              <div className="space-y-5 py-2">
                <div className="rounded-xl border border-violet-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{selectedProgressRequest.title}</p>
                  <p className="mt-1 text-sm text-slate-600">Client: {selectedProgressRequest.client}</p>
                </div>

                <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-800">Progress: {progressValue}%</Label>
                  </div>
                  <Slider
                    value={[progressValue]}
                    onValueChange={(value) => setProgressValue(value[0])}
                    max={100}
                    step={1}
                    className="w-full [&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:bg-violet-100 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-violet-600 [&_[data-slot=slider-range]]:via-indigo-600 [&_[data-slot=slider-range]]:to-blue-600 [&_[data-slot=slider-thumb]]:border-violet-500 [&_[data-slot=slider-thumb]]:bg-white"
                  />
                  <div className="flex items-center justify-between text-xs font-medium text-violet-700">
                    <span>0%</span>
                    <span>{progressValue}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Work Description</Label>
                  <Textarea
                    rows={4}
                    placeholder="Describe completed milestones and next implementation step..."
                    value={workUpdate}
                    onChange={(event) => setWorkUpdate(event.target.value)}
                    className="border-violet-200 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setProgressRequestId(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={handleSaveProgress}
                    className="border-0 bg-[linear-gradient(100deg,#7c3aed_0%,#4f46e5_45%,#2563eb_100%)] text-white hover:brightness-110"
                  >
                    Save Progress Update
                  </Button>
                  {progressValue >= 100 && (
                    <Button
                      onClick={handleMarkAsCompleted}
                      className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Completed
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(selectedSlaRequest)} onOpenChange={(open) => !open && setSlaRequestId(null)}>
          <DialogContent className="max-h-[88dvh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-violet-700 to-black bg-clip-text text-xl text-transparent">
                SLA Contract Details
              </DialogTitle>
            </DialogHeader>

            {selectedSlaRequest && (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedSlaRequest.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">Formal SLA overview for this task.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <UserRound className="h-4 w-4 text-violet-600" />
                    Client: {selectedSlaRequest.client}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <CalendarClock className="h-4 w-4 text-indigo-600" />
                    Deadline: {formatDate(selectedSlaRequest.deadline)}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    Task Price: {selectedSlaRequest.budget}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <Activity className="h-4 w-4 text-blue-600" />
                    Task State: {resolveSlaUiMeta(selectedSlaRequest).taskStateLabel}
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200 bg-white/90 p-4 text-sm leading-6 text-slate-700">
                  This SLA contract confirms a formal agreement between the task provider and the task requester.
                  Both parties agree to follow the approved scope, timeline, and communication responsibilities
                  until delivery acceptance.
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-white px-2 py-1 text-xs font-semibold text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Platform Fee Breakdown
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p>Base Task Price: {selectedSlaRequest.budget}</p>
                    <p>Platform Service Profit (7%): {formatPrice(parsePrice(selectedSlaRequest.budget) * 0.07)}</p>
                    <p className="font-semibold text-slate-900">
                      Total Contract Value: {formatPrice(parsePrice(selectedSlaRequest.budget) * 1.07)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  Blocked indicates that one side has suspended progress and delivery is currently paused.
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
}

