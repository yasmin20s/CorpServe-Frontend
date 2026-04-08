import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ActiveRequestCard from '../../components/ActiveRequestCard';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Slider } from '../../components/ui/slider';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  FileStack,
  TrendingUp,
  FileText,
  AlertTriangle,
  CalendarClock,
  Wallet,
  UserRound,
  Sparkles,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getVendorActiveRequestsApi, getVendorSlaContractApi } from '../../services/proposalsApi';
import { resolveSlaDialogStatus } from '../../lib/activeRequestBadges';
import { updateRequestProgressApi } from '../../services/vendorRequestsApi';
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

const ITEMS_PER_PAGE = 3;

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB');
}

function formatPrice(value) {
  return `EGP ${Math.round(Number(value || 0)).toLocaleString()}`;
}

export default function VendorActiveRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeRequests, setActiveRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOpenSlaRequestId, setPendingOpenSlaRequestId] = useState(null);
  const [progressRequestId, setProgressRequestId] = useState(null);
  const [progressRequest, setProgressRequest] = useState(null);
  const [slaRequestId, setSlaRequestId] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [slaLoading, setSlaLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [workUpdate, setWorkUpdate] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskStateFilter, setTaskStateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const id = location.state?.openSlaForRequestId;
    if (typeof id === 'string' && id.trim()) {
      setPendingOpenSlaRequestId(id.trim());
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const loadActiveRequests = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const result = await getVendorActiveRequestsApi({
        token: user.token,
        search: searchQuery,
        slaLabel: statusFilter === 'all' ? undefined : statusFilter,
        taskState: taskStateFilter === 'all' ? undefined : taskStateFilter,
        pageIndex: currentPage,
        pageSize: ITEMS_PER_PAGE,
      });
      const items = Array.isArray(result?.data) ? result.data : [];
      setActiveRequests(items);
      setTotalCount(result?.count || 0);
    } catch (error) {
      toast.error(error.message || 'Failed to load active requests');
      setActiveRequests([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, searchQuery, statusFilter, taskStateFilter, currentPage]);

  useEffect(() => {
    loadActiveRequests();
  }, [loadActiveRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, taskStateFilter]);

  useSignalREvent(
    [
      'Request progress updated',
      'SLA created',
      'SLA completed',
      'SLA blocked',
      'SLA delayed',
      'SLA deadline warning',
    ],
    loadActiveRequests,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const handleOpenProgressDialog = (request) => {
    setProgressRequestId(request.requestId);
    setProgressRequest(request);
    setProgressValue(Number(request.progressPercentage || 0));
    setWorkUpdate('');
  };

  const handleSaveProgress = async () => {
    if (!progressRequest || !user?.token) return;
    const cleanedUpdate = workUpdate.trim();
    if (!cleanedUpdate) {
      toast.error('Please provide a work description');
      return;
    }

    setSavingProgress(true);
    try {
      await updateRequestProgressApi({
        requestId: progressRequest.requestId,
        percentage: progressValue,
        description: cleanedUpdate,
        token: user.token,
      });
      toast.success('Progress updated successfully.');
      setProgressRequestId(null);
      setProgressRequest(null);
      await loadActiveRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to update progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleViewSla = useCallback(async (requestId) => {
    if (!user?.token) return;
    setSlaRequestId(requestId);
    setSlaLoading(true);
    setSlaData(null);
    try {
      const result = await getVendorSlaContractApi({ requestId, token: user.token });
      setSlaData(result);
    } catch (error) {
      toast.error(error.message || 'Failed to load SLA contract');
      setSlaRequestId(null);
    } finally {
      setSlaLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (!pendingOpenSlaRequestId || isLoading || !user?.token) return;
    const id = pendingOpenSlaRequestId;
    setPendingOpenSlaRequestId(null);
    void handleViewSla(id);
  }, [pendingOpenSlaRequestId, isLoading, user?.token, handleViewSla]);

  const handleOpenChat = (request) => {
    navigate('/vendor/chat', {
      state: {
        counterpartyName: request.clientName || 'Client',
        project: request.title,
        targetRole: 'client',
      },
    });
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
          {isLoading && (
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-semibold text-slate-800">Loading active requests...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && activeRequests.length === 0 && (
            <Card className="border border-slate-300 bg-slate-200/70">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">All Done</Badge>
                <p className="text-lg font-semibold text-slate-900">No active requests right now.</p>
                <p className="text-sm text-slate-600">All tracked requests have been moved to Completed.</p>
              </CardContent>
            </Card>
          )}

          {activeRequests.map((request) => (
            <ActiveRequestCard
              key={request.requestId}
              request={request}
              role="vendor"
              onUpdateProgress={handleOpenProgressDialog}
              onViewSla={handleViewSla}
              onChat={handleOpenChat}
            />
          ))}

          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Page {safeCurrentPage} of {totalPages}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}>Previous</Button>
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
                <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(progressRequestId)} onOpenChange={(open) => !open && setProgressRequestId(null)}>
        <DialogContent className="max-h-[88dvh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">Update Progress</DialogTitle>
          </DialogHeader>
          {progressRequest && (
            <div className="space-y-5 py-2">
              <div className="rounded-xl border border-violet-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">{progressRequest.title}</p>
                <p className="mt-1 text-sm text-slate-600">Client: {progressRequest.clientName || 'Client'}</p>
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
                <Button variant="outline" onClick={() => setProgressRequestId(null)}>Close</Button>
                <Button
                  onClick={handleSaveProgress}
                  disabled={savingProgress}
                  className="border-0 bg-[linear-gradient(100deg,#7c3aed_0%,#4f46e5_45%,#2563eb_100%)] text-white hover:brightness-110"
                >
                  {savingProgress ? 'Saving...' : 'Save Progress Update'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(slaRequestId)} onOpenChange={(open) => !open && setSlaRequestId(null)}>
        <DialogContent className="max-h-[88dvh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-violet-700 to-black bg-clip-text text-xl text-transparent">
              SLA Contract Details
            </DialogTitle>
          </DialogHeader>
          {slaLoading && <p className="py-6 text-center text-slate-600">Loading SLA contract...</p>}
          {slaData && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">{slaData.requestTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">Formal SLA overview for this task.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <UserRound className="h-4 w-4 text-violet-600" />
                  Client: {slaData.clientName}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <CalendarClock className="h-4 w-4 text-indigo-600" />
                  Deadline: {formatDate(slaData.deadline)}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Contract Price: {formatPrice(slaData.contractPrice)}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <Activity className="h-4 w-4 text-blue-600" />
                  SLA Status: {resolveSlaDialogStatus(slaData)}
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
                  <p>Base Task Price: {formatPrice(slaData.contractPrice)}</p>
                  <p>Platform Service Profit (7%): {formatPrice(slaData.contractPrice * 0.07)}</p>
                  <p className="font-semibold text-slate-900">
                    Total Contract Value: {formatPrice(slaData.contractPrice * 1.07)}
                  </p>
                </div>
              </div>
              {slaData.isWarning && (
                <div className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Warning: {slaData.warningLevel}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
