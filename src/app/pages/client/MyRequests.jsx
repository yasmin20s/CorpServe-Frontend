import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, Search, Eye, ClipboardList, CheckCircle2, Clock3, Layers3, Type, Shapes, CircleDollarSign, User, Gauge, Star, MessageSquareText, Pencil, Trash2, Upload, FileText, X } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { deleteRequestApi, getMyRequestsApi, updateRequestApi } from '../../services/requestsApi';

function formatCurrency(value) {
  if (value == null || value === '') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `EGP ${numeric.toLocaleString()}`;
}

function toAbsoluteFileUrl(fileUrl) {
  if (!fileUrl) return '';
  if (String(fileUrl).startsWith('http')) return fileUrl;
  const normalizedBase = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');
  return `${normalizedBase}${String(fileUrl).startsWith('/') ? '' : '/'}${fileUrl}`;
}

function getDisplayFileName(fileLike, idx) {
  const explicitName = fileLike?.fileName || fileLike?.name || fileLike?.title;
  if (explicitName) return explicitName;
  const sourceUrl = fileLike?.fileUrl || fileLike?.url || fileLike?.path;
  if (!sourceUrl) return `Document ${idx + 1}`;
  const rawName = sourceUrl.split('/').pop() || `Document ${idx + 1}`;
  return decodeURIComponent(rawName).replace(/^[a-f0-9]{8}-[a-f0-9-]{27}_/i, '');
}

function normalizeRequestDocuments(request) {
  const source = request?.attachments || request?.documents || request?.files || [];
  if (!Array.isArray(source)) return [];

  return source
    .map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `${request?.id || 'request'}-doc-${idx}`,
          name: getDisplayFileName({ fileUrl: item }, idx),
          url: item,
        };
      }

      const url = item?.fileUrl || item?.url || item?.path || '';
      return {
        id: item?.id || `${request?.id || 'request'}-doc-${idx}`,
        name: getDisplayFileName(item, idx),
        url,
      };
    })
    .filter((doc) => Boolean(doc.url));
}

function toDateInputValue(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
export default function MyRequests() {
    const itemsPerPage = 3;
  const navigate = useNavigate();
    const { user } = useAuth();
  const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([{ id: 'all', name: 'All Categories' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [editingRequest, setEditingRequest] = useState(null);
    const [editForm, setEditForm] = useState({
      title: '',
      description: '',
      categoryId: '',
      budgetMin: '',
      budgetMax: '',
      deadline: '',
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [deletingRequestId, setDeletingRequestId] = useState(null);
    const [requestPendingDelete, setRequestPendingDelete] = useState(null);
    const [editAttachments, setEditAttachments] = useState([]);

    const getDeadlineLabel = () => 'Expected Deadline';
    const getDeadlineValue = (request) => request.expectedDeadline || '-';

    const openDocument = (fileUrl) => {
      if (!fileUrl) return;
      const absoluteUrl = toAbsoluteFileUrl(fileUrl);
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
    };

    
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

    const loadPendingRequests = useCallback(async () => {
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
            categoryId: request.categoryId,
            status: String(request.requestStatus || '').toLowerCase(),
            budgetMin: formatCurrency(request.budgetMin),
            budgetMax: formatCurrency(request.budgetMax),
            rawBudgetMin: Number(request.budgetMin || 0),
            rawBudgetMax: Number(request.budgetMax || 0),
            expectedDeadline: request.expectedDeadline
              ? new Date(request.expectedDeadline).toLocaleDateString()
              : '-',
            rawExpectedDeadline: request.expectedDeadline || '',
            progress: request.progressPercentage || 0,
            createdAt: request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-',
            aiEstimatedCost: formatCurrency(request.estimatedCost),
            aiEstimatedDeadline: request.estimatedTime
              ? new Date(request.estimatedTime).toLocaleDateString()
              : '-',
            aiConfidence: Number(request.confidence ?? 0),
            proposalsCount: Number(
              request.proposalCount
              ?? request.proposalsCount
              ?? request.numberOfProposals
              ?? request.vendorProposalsCount
              ?? (Array.isArray(request.proposals) ? request.proposals.length : 0),
            ),
            documents: normalizeRequestDocuments(request),
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
    }, [user?.token, searchQuery, categoryFilter, currentPage]);

    useEffect(() => {
      loadPendingRequests();
    }, [loadPendingRequests]);

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

    const editCategoryOptions = useMemo(
      () => categoryOptions.filter((item) => item.id !== 'all'),
      [categoryOptions],
    );

    const openEditDialog = (request) => {
      setEditingRequest(request);
      setEditForm({
        title: request.title || '',
        description: request.description || '',
        categoryId: request.categoryId || '',
        budgetMin: String(request.rawBudgetMin ?? ''),
        budgetMax: String(request.rawBudgetMax ?? ''),
        deadline: toDateInputValue(request.rawExpectedDeadline),
      });
      setEditAttachments([]);
    };

    const formatFileSize = (bytes) => {
      if (!Number.isFinite(bytes)) return '-';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleEditAttachmentsChange = (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      setEditAttachments((prev) => {
        const existing = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
        const next = [...prev];

        files.forEach((file) => {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (!existing.has(key)) {
            next.push(file);
          }
        });

        return next;
      });

      event.target.value = '';
    };

    const removeEditAttachment = (targetFile) => {
      setEditAttachments((prev) => prev.filter((file) => !(file.name === targetFile.name && file.size === targetFile.size && file.lastModified === targetFile.lastModified)));
    };

    const handleSaveEdit = async () => {
      if (!editingRequest?.id || !user?.token) {
        toast.error('Unable to edit this request now');
        return;
      }

      if (!editForm.title.trim() || !editForm.description.trim() || !editForm.categoryId || !editForm.deadline) {
        toast.error('Please complete all edit fields first');
        return;
      }

      const min = Number(editForm.budgetMin);
      const max = Number(editForm.budgetMax);
      if (Number.isNaN(min) || Number.isNaN(max) || min <= 0 || max <= 0 || min > max) {
        toast.error('Please enter a valid budget range');
        return;
      }

      setIsSavingEdit(true);
      try {
        await updateRequestApi({
          requestId: editingRequest.id,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          categoryId: editForm.categoryId,
          expectedDeadline: new Date(editForm.deadline).toISOString(),
          budgetMin: min,
          budgetMax: max,
          attachments: editAttachments,
          token: user.token,
        });

        toast.success('Request updated successfully');
        setEditingRequest(null);
        setEditAttachments([]);
        await loadPendingRequests();
      } catch (error) {
        const details = error?.status ? `${error.message} (status ${error.status})` : (error.message || 'Failed to update request');
        toast.error(details);
      } finally {
        setIsSavingEdit(false);
      }
    };

    const handleDeleteRequest = async (request) => {
      if (!request?.id || !user?.token) {
        toast.error('Unable to delete this request now');
        return;
      }

      setDeletingRequestId(request.id);
      try {
        await deleteRequestApi({ requestId: request.id, token: user.token });
        toast.success('Request deleted successfully');
        setSelectedRequest((prev) => (prev?.id === request.id ? null : prev));
        setRequestPendingDelete((prev) => (prev?.id === request.id ? null : prev));
        await loadPendingRequests();
      } catch (error) {
        const details = error?.status ? `${error.message} (status ${error.status})` : (error.message || 'Failed to delete request');
        toast.error(details);
      } finally {
        setDeletingRequestId(null);
      }
    };

    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <Dialog open={Boolean(editingRequest)} onOpenChange={(open) => {
          if (!open)
              setEditingRequest(null);
      }}>
        <DialogContent className="max-h-[85dvh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 shadow-[0_24px_80px_-35px_rgba(76,29,149,0.65)] backdrop-blur-md sm:max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-indigo-900">Edit Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Title</p>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Request title"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Description</p>
                <Textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your request"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Category</p>
                <Select value={editForm.categoryId} onValueChange={(value) => setEditForm((prev) => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {editCategoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Deadline</p>
                <Input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Min Budget</p>
                <Input
                  type="number"
                  value={editForm.budgetMin}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, budgetMin: e.target.value }))}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Max Budget</p>
                <Input
                  type="number"
                  value={editForm.budgetMax}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, budgetMax: e.target.value }))}
                  placeholder="10000"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Uploaded Documents</p>

                <div className="rounded-xl border border-dashed border-indigo-300 bg-white/70 p-4">
                  <label htmlFor="edit-request-attachments" className="cursor-pointer">
                    <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100">
                      <Upload className="h-4 w-4" />
                      Upload New Documents
                    </div>
                    <input
                      id="edit-request-attachments"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleEditAttachmentsChange}
                    />
                  </label>
                </div>

                {editingRequest?.documents?.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-indigo-200 bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Files</p>
                    {editingRequest.documents.map((doc, idx) => (
                      <div key={doc.id} className="flex flex-col gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="truncate text-sm text-slate-700">{doc.name || `Document ${idx + 1}`}</p>
                        <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-100" onClick={() => openDocument(doc.url)}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {editAttachments.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">New Files To Upload</p>
                    {editAttachments.map((file) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg border border-violet-200 bg-white/90 p-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => removeEditAttachment(file)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingRequest(null)}>
                Cancel
              </Button>
              <Button className="bg-[#6f74ea] text-white hover:bg-[#5f64da]" onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => {
          if (!open)
              setSelectedRequest(null);
      }}>
        <DialogContent className="max-h-[82vh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 p-0 shadow-[0_24px_80px_-35px_rgba(76,29,149,0.65)] backdrop-blur-md sm:max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-violet-700 to-black bg-clip-text px-4 pt-2 text-xl text-transparent sm:px-6">Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 px-4 pb-5 pt-3 sm:px-6 sm:pb-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">{selectedRequest.title}</h3>
                <p className="mt-1 text-sm text-slate-600">All details, uploaded documents, and AI estimate insights in one view.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-indigo-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                      <Type className="h-3.5 w-3.5" />
                    </span>
                    Title
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{selectedRequest.title}</p>
                </div>
                <div className="rounded-xl border border-indigo-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                      <Shapes className="h-3.5 w-3.5" />
                    </span>
                    Category
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{selectedRequest.category}</p>
                </div>
                <div className="rounded-xl border border-indigo-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" />
                    </span>
                    {getDeadlineLabel(selectedRequest)}
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{getDeadlineValue(selectedRequest)}</p>
                </div>
                <div className="rounded-xl border border-indigo-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <Badge className={`mt-1 ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200/80 bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Description
                </p>
                <p className="mt-2 text-sm text-slate-700">{selectedRequest.description}</p>
              </div>

              <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">AI Estimation</p>
                  <Badge className="border border-indigo-200 bg-white text-indigo-700">
                    {Number.isFinite(selectedRequest.aiConfidence) ? `${selectedRequest.aiConfidence}% confidence` : 'No confidence'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-indigo-200/80 bg-white/90 p-3 transition-all duration-300 hover:shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Estimated Budget</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{selectedRequest.aiEstimatedCost}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-200/80 bg-white/90 p-3 transition-all duration-300 hover:shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Estimated Deadline</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{selectedRequest.aiEstimatedDeadline}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Confidence Meter</span>
                    <span>{selectedRequest.aiConfidence || 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-indigo-100 bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 transition-all duration-1000"
                      style={{ width: `${Math.max(0, Math.min(100, selectedRequest.aiConfidence || 0))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Uploaded Documents</p>
                  <Badge className="border border-indigo-200 bg-white text-indigo-700">
                    {selectedRequest.documents.length} file{selectedRequest.documents.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                {selectedRequest.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-white/90 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="truncate text-sm font-medium text-slate-800">{doc.name || `Document ${idx + 1}`}</p>
                        <Button
                          size="sm"
                          className="w-full bg-[#6f74ea] text-white hover:bg-[#5f64da] sm:w-auto"
                          onClick={() => openDocument(doc.url)}
                        >
                          View File
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-indigo-300 bg-white/70 p-3 text-sm text-indigo-700">
                    No uploaded documents available for this request.
                  </div>
                )}
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

      <AlertDialog open={Boolean(requestPendingDelete)} onOpenChange={(open) => {
          if (!open && !deletingRequestId) {
            setRequestPendingDelete(null);
          }
      }}>
        <AlertDialogContent className="max-w-md border-2 border-red-300 bg-white shadow-[0_18px_45px_rgba(239,68,68,0.12)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700">
              This action cannot be undone.
              {requestPendingDelete?.title ? ` Are you sure you want to delete "${requestPendingDelete.title}"?` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingRequestId)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (requestPendingDelete && !deletingRequestId) {
                  handleDeleteRequest(requestPendingDelete);
                }
              }}
              disabled={Boolean(deletingRequestId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletingRequestId ? 'Deleting...' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
              {paginatedRequests.map((request, idx) => (<Card key={request.id} className="group relative overflow-hidden border-0 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-indigo-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(99,102,241,0.22)] hover:ring-indigo-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 60}ms` }}>
              <CardContent className="p-6">
                <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-indigo-200/35 blur-2xl" />
                <div className="pointer-events-none absolute -left-8 -bottom-12 h-28 w-28 rounded-full bg-emerald-200/30 blur-2xl" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-extrabold leading-tight text-slate-900 tracking-tight">{request.title}</h3>
                      <Badge className={getStatusBadge(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                        {request.category}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                        Created {request.createdAt}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">{request.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <button
                    type="button"
                    className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                    onClick={() => navigate(`/client/proposals/${request.id}`, { state: { request } })}
                  >
                    <p className="text-sm font-semibold text-violet-700 mb-1">Proposals</p>
                    <p className="text-2xl font-black text-slate-900">{request.proposalsCount}</p>
                    <p className="text-xs text-slate-600 mt-1">View vendor offers for this request</p>
                  </button>
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
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50" onClick={() => openEditDialog(request)}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setRequestPendingDelete(request)}
                    disabled={deletingRequestId === request.id}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingRequestId === request.id ? 'Deleting...' : 'Delete'}
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
