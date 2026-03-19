import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, Search, MessageSquare, Eye, ClipboardList, CheckCircle2, Clock3, Layers3, Type, Shapes, CircleDollarSign, User, Gauge, Star, MessageSquareText } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const requests = [
    {
        id: '1',
        title: 'IT Infrastructure Setup',
        category: 'IT Support',
    description: 'Set up core IT infrastructure including server racks, internal networking, and secure workstation provisioning for the new HQ floor.',
        status: 'active',
        vendor: 'TechPro Solutions',
        proposals: null,
    budget: '$7,200',
    deadline: '2026-04-10',
        progress: 65,
        createdAt: '2026-02-15',
    },
    {
        id: '2',
        title: 'Office Cleaning Service',
        category: 'Cleaning',
        description: 'Daily and weekly cleaning operations for all office zones, with deep sanitation for meeting rooms and reception areas.',
        status: 'completed',
        vendor: 'CleanCo Services',
      vendorRating: 4.9,
      feedback: 'Excellent quality and always on time. The team was professional and responsive throughout the contract.',
      paidBudget: '$2,850',
      proposals: null,
      budget: '$2,850',
      deadline: '2026-02-20',
        progress: 100,
        createdAt: '2026-01-20',
    },
    {
        id: '3',
        title: 'Marketing Campaign Design',
        category: 'Marketing',
        description: 'Create a full-funnel campaign with social assets, paid ads creatives, and landing-page messaging for Q2 launch.',
        status: 'active',
        vendor: 'Creative Agency',
        proposals: null,
        budget: '$12,400',
        deadline: '2026-04-18',
        progress: 40,
        createdAt: '2026-02-28',
    },
    {
        id: '4',
        title: 'Security System Installation',
        category: 'Security',
        description: 'Install access control, CCTV coverage, and real-time monitoring setup across all office entrances and key areas.',
        status: 'pending',
        vendor: null,
        proposals: 3,
        budgetMin: '$15,000',
        budgetMax: '$20,000',
        expectedDeadline: '2026-04-25',
        progress: 0,
        createdAt: '2026-03-01',
    },
    {
        id: '5',
        title: 'Website Redesign',
        category: 'Design',
        description: 'Redesign corporate website with updated branding, improved service pages, and mobile-first UX enhancements.',
        status: 'pending',
        vendor: null,
        proposals: 5,
        budgetMin: '$8,000',
        budgetMax: '$12,000',
        expectedDeadline: '2026-04-30',
        progress: 0,
        createdAt: '2026-03-03',
    },
    {
        id: '6',
        title: 'Reception Area Renovation',
        category: 'Maintenance',
        description: 'Upgrade flooring, repaint walls, and modernize reception lighting and furniture for a premium first impression.',
        status: 'active',
        vendor: 'BuildRight Works',
        proposals: null,
        budget: '$22,000',
        deadline: '2026-05-08',
        progress: 25,
        createdAt: '2026-03-04',
    },
    {
        id: '7',
        title: 'Company Event Branding Pack',
        category: 'Marketing',
        description: 'Design complete branding kit for annual event including visuals, printed materials, and social teaser assets.',
        status: 'pending',
        vendor: null,
        proposals: 2,
        budgetMin: '$4,000',
        budgetMax: '$6,000',
        expectedDeadline: '2026-04-22',
        progress: 0,
        createdAt: '2026-03-07',
    },
];
export default function MyRequests() {
    const itemsPerPage = 3;
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const getBudgetLabel = (request) => (request.status === 'pending' ? 'Budget Range' : 'Budget');
    const getBudgetValue = (request) => (request.status === 'pending' ? `${request.budgetMin} - ${request.budgetMax}` : request.budget || '-');
    const getDeadlineLabel = (request) => (request.status === 'pending' ? 'Expected Deadline' : 'Deadline');
    const getDeadlineValue = (request) => (request.status === 'pending' ? request.expectedDeadline || '-' : request.deadline || '-');

    const getStatusBadge = (status) => {
        const variants = {
        active: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
            completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            pending: 'bg-amber-100 text-amber-700 border border-amber-200',
            cancelled: 'bg-red-100 text-red-700',
        };
        return variants[status] || variants.pending;
    };

    const categoryOptions = useMemo(() => ['all', ...new Set(requests.map((request) => request.category))], []);

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            const matchesSearch =
                request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [searchQuery, categoryFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

    const activeCount = requests.filter((request) => request.status === 'active').length;
    const completedCount = requests.filter((request) => request.status === 'completed').length;
    const pendingCount = requests.filter((request) => request.status === 'pending').length;

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (value) => {
        setCategoryFilter(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
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
                <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
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
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
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
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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
                      {request.vendor ? 'Vendor' : 'Proposals'}
                    </p>
                    <p className="font-medium text-slate-900">
                      {request.vendor || `${request.proposals} proposals received`}
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
                  {request.status === 'pending' && request.proposals ? (<Link to={`/client/proposals/${request.id}`}>
                      <Button size="sm" variant="default" className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                        <Eye className="w-4 h-4"/>
                        View Proposals ({request.proposals})
                      </Button>
                    </Link>) : null}
                  <Button size="sm" variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setSelectedRequest(request)}>
                    <Eye className="w-4 h-4"/>
                    View My Request
                  </Button>
                  {request.vendor && (<Link to="/client/chat">
                      <Button size="sm" variant="outline" className="gap-2">
                        <MessageSquare className="w-4 h-4"/>
                        Chat
                      </Button>
                    </Link>)}
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
