import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, Search, Eye, ClipboardList, CheckCircle2, Clock3, Layers3, Type, Shapes, CircleDollarSign, User, Gauge, Star, MessageSquareText } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getMyRequestsApi } from '../../services/requestsApi';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
export default function MyRequests() {
    const itemsPerPage = 3;
    const { user } = useAuth();
  const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([{ id: 'all', name: 'All Categories' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const getBudgetLabel = () => 'Budget Range';
    const getBudgetValue = (request) => `${request.budgetMin} - ${request.budgetMax}`;
    const getDeadlineLabel = () => 'Expected Deadline';
    const getDeadlineValue = (request) => request.expectedDeadline || '-';

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-amber-100 text-amber-700 border border-amber-200',
        };
        return variants[status] || variants.pending;
    };

    useEffect(() => {
        const loadRequestBasedCategories = async () => {
            if (!user?.token) {
                setCategoryOptions([{ id: 'all', name: 'All Categories' }]);
                return;
            }

            try {
                let pageIndex = 1;
                const pageSize = 10;
                let totalCount = 0;
                const map = new Map();

                do {
                    const result = await getMyRequestsApi({
                        token: user.token,
                        requestStatus: 1,
                        pageIndex,
                        pageSize,
                        sortByCategory: true,
                        sortDescending: false,
                    });

                    const items = Array.isArray(result?.data) ? result.data : [];
                    totalCount = result?.count || 0;

                    items.forEach((request) => {
                        if (request?.categoryId && request?.categoryName && !map.has(request.categoryId)) {
                            map.set(request.categoryId, request.categoryName);
                        }
                    });

                    pageIndex += 1;
                } while ((pageIndex - 1) * pageSize < totalCount);

                const requestCategories = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
                setCategoryOptions([{ id: 'all', name: 'All Categories' }, ...requestCategories]);
            } catch (error) {
                toast.error(error.message || 'Failed to load request categories');
            }
        };

        loadRequestBasedCategories();
    }, [user?.token]);

    useEffect(() => {
        const loadPendingRequests = async () => {
            if (!user?.token) {
                setRequests([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const result = await getMyRequestsApi({
                    token: user.token,
                    search: searchQuery,
                    requestStatus: 1,
                    categoryId: categoryFilter === 'all' ? '' : categoryFilter,
                    pageIndex: currentPage,
                    pageSize: itemsPerPage,
                    sortByCategory: false,
                    sortDescending: true,
                });

                const items = Array.isArray(result?.data) ? result.data : [];
                setRequests(
                    items.map((request) => ({
                        id: request.id,
                        title: request.title,
                        description: request.description,
                        category: request.categoryName,
                        status: String(request.requestStatus || '').toLowerCase(),
                        budgetMin: `EGP ${Number(request.budgetMin || 0).toLocaleString()}`,
                        budgetMax: `EGP ${Number(request.budgetMax || 0).toLocaleString()}`,
                        expectedDeadline: request.expectedDeadline
                            ? new Date(request.expectedDeadline).toLocaleDateString()
                            : '-',
                        progress: request.progressPercentage || 0,
                        createdAt: request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-',
                    })),
                );
                setTotalCount(result?.count || 0);
            } catch (error) {
                setRequests([]);
                setTotalCount(0);
                toast.error(error.message || 'Failed to load requests');
            } finally {
                setIsLoading(false);
            }
        };

        loadPendingRequests();
    }, [user?.token, searchQuery, categoryFilter, currentPage]);

    const filteredRequests = requests;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedRequests = requests;

    const pendingCount = totalCount;

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (value) => {
        setCategoryFilter(value);
        setCurrentPage(1);
    };

    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => {
          if (!open)
              setSelectedRequest(null);
      }}>
        <DialogContent className="border border-indigo-100" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>View My Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Request details and current execution status.</p>

          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Type className="h-3.5 w-3.5" />
                    Title
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{selectedRequest.title}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Shapes className="h-3.5 w-3.5" />
                    Category
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{selectedRequest.category}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <CircleDollarSign className="h-3.5 w-3.5" />
                    {getBudgetLabel(selectedRequest)}
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{getBudgetValue(selectedRequest)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {getDeadlineLabel(selectedRequest)}
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{getDeadlineValue(selectedRequest)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <Badge className={`mt-1 ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Description
                </p>
                <p className="mt-2 text-sm text-slate-700">{selectedRequest.description}</p>
              </div>

              {selectedRequest.status === 'active' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        <User className="h-3.5 w-3.5" />
                        Vendor Name
                      </p>
                      <p className="font-semibold text-slate-900">{selectedRequest.vendor || '-'}</p>
                    </div>
                    <Badge className="bg-white text-indigo-700 border border-indigo-200">Active Request</Badge>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-4 w-4" />
                        Progress
                      </span>
                      <span>{selectedRequest.progress}%</span>
                    </div>
                    <Progress
                      value={selectedRequest.progress}
                      className="h-2 bg-indigo-100/70"
                      indicatorClassName="bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                    />
                  </div>
                </div>
              )}

              {selectedRequest.status === 'completed' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        <User className="h-3.5 w-3.5" />
                        Vendor Name
                      </p>
                      <p className="font-semibold text-slate-900">{selectedRequest.vendor || '-'}</p>
                    </div>
                    <Badge className="bg-white text-emerald-700 border border-emerald-200">Completed Request</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-white/90 p-3">
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        <Star className="h-3.5 w-3.5" />
                        Rating
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedRequest.vendorRating ?? '-'} / 5</p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-white/90 p-3">
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        <CircleDollarSign className="h-3.5 w-3.5" />
                        Paid Budget
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedRequest.paidBudget || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-emerald-200 bg-white/90 p-3">
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Feedback
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{selectedRequest.feedback || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-blue-100 p-6 shadow-[0_16px_36px_rgba(79,70,229,0.2)] md:p-8">
          <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-indigo-300/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-300/35 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-black text-indigo-900">My Requests</h1>
              <p className="text-indigo-800/80">Track request lifecycle, monitor active work, and review vendor progress in one place.</p>
            </div>
            <Link to="/client/create-request">
              <Button className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                <PlusCircle className="w-4 h-4"/>
                New Request
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f74ea] text-white">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Total Requests</p>
                <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Active</p>
                <p className="text-2xl font-bold text-slate-900">-</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Completed</p>
                <p className="text-2xl font-bold text-slate-900">-</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                <Input placeholder="Search requests..." className="pl-10" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-700">
                Showing pending requests only
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
              {paginatedRequests.map((request) => (<Card key={request.id} className="group relative overflow-hidden border-0 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-indigo-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.18)] hover:ring-indigo-200">
              <CardContent className="p-6">
                <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-indigo-200/35 blur-2xl" />
                <div className="pointer-events-none absolute -left-8 -bottom-12 h-28 w-28 rounded-full bg-emerald-200/30 blur-2xl" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                      <Badge className={getStatusBadge(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Category:</span>
                        <span>{request.category}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{getBudgetLabel(request)}:</span>
                        <span>{getBudgetValue(request)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{getDeadlineLabel(request)}:</span>
                        <span>{getDeadlineValue(request)}</span>
                      </span>
                      <span>Created: {request.createdAt}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{request.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-sm text-slate-600 mb-1">
                      Proposals
                    </p>
                    <p className="font-medium text-slate-900">
                      Pending module will be integrated next
                    </p>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <div className="flex items-center justify-between text-sm text-slate-700 mb-1">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-4 w-4" />
                        Progress
                      </span>
                      <span>{request.progress}%</span>
                    </div>
                    <Progress
                      value={request.progress}
                      className="h-2 bg-indigo-100/70"
                      indicatorClassName="bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setSelectedRequest(request)}>
                    <Eye className="w-4 h-4"/>
                    View My Request
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>

        {filteredRequests.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white/90 p-3">
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
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
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

        {filteredRequests.length === 0 && (
          <Card className="border border-slate-200 bg-slate-50/90">
            <CardContent className="p-8 text-center">
              <Layers3 className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="font-medium text-slate-700">No requests found</p>
              <p className="text-sm text-slate-500">Try changing your filters or search keyword.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>);
}
