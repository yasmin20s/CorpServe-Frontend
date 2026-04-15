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
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, Search, Eye, ClipboardList, CheckCircle2, CalendarClock, Clock3, Layers3, Type, Shapes, CircleDollarSign, User, Gauge, Star, MessageSquareText, Pencil, Trash2, Upload, FileText, X } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { deleteRequestApi, getMyRequestsApi, updateRequestApi } from '../../services/requestsApi';
import { getProposalCountApi } from '../../services/proposalsApi';
import { useSignalREvent } from '../../context/SignalRContext';
import { normalizeRequestDocuments, toAbsoluteFileUrl } from '../../lib/requestDocuments';
import { formatRequestCreatedAtLabel } from '../../lib/relativeTime';

function formatCurrency(value) {
  if (value == null || value === '') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `EGP ${numeric.toLocaleString()}`;
}

function toDateInputValue(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function normalizeRequestStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 'pending';

  if (raw === '1' || raw === 'pending' || raw === 'open') return 'pending';
  if (raw === '2' || raw === 'active' || raw === 'inprogress' || raw === 'in progress') return 'active';
  if (raw === '3' || raw === 'completed' || raw === 'done' || raw === 'closed') return 'completed';

  return raw;
}

function pickSelectedVendorName(request) {
  const direct =
    request?.vendorName
    ?? request?.VendorName
    ?? request?.selectedVendorName
    ?? request?.SelectedVendorName
    ?? request?.assignedVendorName
    ?? request?.AssignedVendorName
    ?? request?.acceptedVendorName
    ?? request?.AcceptedVendorName;

  if (direct != null && String(direct).trim()) {
    return String(direct).trim();
  }

  const nested =
    request?.selectedProposal?.vendorName
    ?? request?.selectedProposal?.VendorName
    ?? request?.acceptedProposal?.vendorName
    ?? request?.acceptedProposal?.VendorName;

  return nested != null && String(nested).trim() ? String(nested).trim() : '';
}

/** API nests AI fields under aiEstimation / AIEstimation (camelCase quirks possible). */
/** Avoid showing raw HTTP codes like "status 409" in toasts. */
function userFacingErrorMessage(error, fallback) {
  const fb = fallback || 'Something went wrong. Please try again.';
  let msg = typeof error?.message === 'string' ? error.message.trim() : '';
  msg = msg.replace(/\s*\(status\s+\d+\)\s*$/i, '').trim();
  msg = msg.replace(/\bstatus\s+\d+\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  if (/^Request failed with status \d+\.?$/i.test(msg)) {
    msg = '';
  }
  if (msg) return msg;
  const status = error?.status;
  if (status === 409) {
    return 'This request can no longer be changed that way. It may already have proposals or be in progress.';
  }
  if (status === 404) return 'We could not find that request.';
  if (status === 401 || status === 403) {
    return 'You are not allowed to do this. Please sign in again if needed.';
  }
  if (status === 400) return 'Some of the information provided is not valid. Please check and try again.';
  return fb;
}

function pickAiFieldsFromRequest(request) {
  const ai =
    request?.aiEstimation
    ?? request?.aIEstimation
    ?? request?.AIEstimation;
  if (ai && typeof ai === 'object') {
    return {
      estimatedCost: ai.estimatedCost ?? ai.EstimatedCost,
      estimatedTime: ai.estimatedTime ?? ai.EstimatedTime,
      confidence: ai.confidence ?? ai.Confidence,
    };
  }
  return {
    estimatedCost: request?.estimatedCost ?? request?.EstimatedCost,
    estimatedTime: request?.estimatedTime ?? request?.EstimatedTime,
    confidence: request?.confidence ?? request?.Confidence,
  };
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
    const [statusFilter, setStatusFilter] = useState('all');
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
    const [editAttachmentIdsToRemove, setEditAttachmentIdsToRemove] = useState([]);
    const [statusSummary, setStatusSummary] = useState({ pending: 0, active: 0, completed: 0 });

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
            active: 'bg-violet-100 text-violet-800 border border-violet-200',
            completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
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
                toast.error(userFacingErrorMessage(error, 'Failed to load request categories'));
            }
        };

        loadRequestBasedCategories();
    }, [user?.token]);

    const loadStatusSummary = useCallback(async () => {
      if (!user?.token) {
        setStatusSummary({ pending: 0, active: 0, completed: 0 });
        return;
      }
      const categoryId = categoryFilter === 'all' ? '' : categoryFilter;
      const base = {
        token: user.token,
        search: searchQuery,
        categoryId,
        pageSize: 1,
        pageIndex: 1,
        sortByCategory: false,
        sortDescending: true,
      };
      try {
        const [pendingRes, activeRes, completedRes] = await Promise.all([
          getMyRequestsApi({ ...base, requestStatus: 1 }),
          getMyRequestsApi({ ...base, requestStatus: 2 }),
          getMyRequestsApi({ ...base, requestStatus: 3 }),
        ]);
        setStatusSummary({
          pending: pendingRes?.count ?? 0,
          active: activeRes?.count ?? 0,
          completed: completedRes?.count ?? 0,
        });
      } catch {
        setStatusSummary({ pending: 0, active: 0, completed: 0 });
      }
    }, [user?.token, searchQuery, categoryFilter]);

    const loadMyRequests = useCallback(async () => {
      if (!user?.token) {
        setRequests([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const requestStatusParam = statusFilter === 'all'
          ? null
          : (statusFilter === 'pending' ? 1 : statusFilter === 'active' ? 2 : statusFilter === 'completed' ? 3 : null);
        const result = await getMyRequestsApi({
          token: user.token,
          search: searchQuery,
          categoryId: categoryFilter === 'all' ? '' : categoryFilter,
          ...(requestStatusParam != null ? { requestStatus: requestStatusParam } : {}),
          pageIndex: currentPage,
          pageSize: itemsPerPage,
          sortByCategory: false,
          sortDescending: true,
        });

        const items = Array.isArray(result?.data) ? result.data : [];
        const mapped = items.map((request) => {
          const fallbackCount = Number(
            request.proposalCount
            ?? request.proposalsCount
            ?? request.numberOfProposals
            ?? request.vendorProposalsCount
            ?? (Array.isArray(request.proposals) ? request.proposals.length : 0),
          );
          const ai = pickAiFieldsFromRequest(request);
          return {
            id: request.id,
            title: request.title,
            description: request.description,
            category: request.categoryName,
            categoryId: request.categoryId,
            status: normalizeRequestStatus(request.requestStatus ?? request.RequestStatus),
            vendor: pickSelectedVendorName(request),
            budgetMin: formatCurrency(request.budgetMin),
            budgetMax: formatCurrency(request.budgetMax),
            rawBudgetMin: Number(request.budgetMin || 0),
            rawBudgetMax: Number(request.budgetMax || 0),
            expectedDeadline: request.expectedDeadline
              ? new Date(request.expectedDeadline).toLocaleDateString()
              : '-',
            rawExpectedDeadline: request.expectedDeadline || '',
            progress: request.progressPercentage || 0,
            createdAt: formatRequestCreatedAtLabel(request.createdAt ?? request.CreatedAt),
            aiEstimatedCost: formatCurrency(ai.estimatedCost),
            aiEstimatedDeadline: ai.estimatedTime
              ? new Date(ai.estimatedTime).toLocaleDateString()
              : '-',
            aiConfidence: Number(ai.confidence ?? 0),
            proposalsCount: Number.isFinite(fallbackCount) ? fallbackCount : 0,
            documents: normalizeRequestDocuments(request, request.id),
          };
        });

        const withProposalCounts = await Promise.all(
          mapped.map(async (row) => {
            if (row.status !== 'pending') {
              return { ...row, proposalsCount: 0 };
            }
            try {
              const raw = await getProposalCountApi({ requestId: row.id, token: user.token });
              const n = typeof raw === 'number' ? raw : Number(raw);
              if (Number.isFinite(n)) {
                return { ...row, proposalsCount: n };
              }
            } catch {
              /* keep fallback from list DTO */
            }
            return row;
          }),
        );

        setRequests(withProposalCounts);
        setTotalCount(result?.count || withProposalCounts.length);
      } catch (error) {
        setRequests([]);
        setTotalCount(0);
        toast.error(userFacingErrorMessage(error, 'Failed to load requests'));
      } finally {
        setIsLoading(false);
      }
    }, [user?.token, searchQuery, categoryFilter, statusFilter, currentPage]);

    useEffect(() => {
      loadMyRequests();
    }, [loadMyRequests]);

    useEffect(() => {
      loadStatusSummary();
    }, [loadStatusSummary]);

    const refreshMyRequestsData = useCallback(async () => {
      await loadMyRequests();
      await loadStatusSummary();
    }, [loadMyRequests, loadStatusSummary]);

    useSignalREvent(['New proposal received', 'Request updated', 'Request deleted'], refreshMyRequestsData);

    const filteredRequests = requests;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedRequests = requests;

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (value) => {
        setCategoryFilter(value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (value) => {
      setStatusFilter(value);
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
      setEditAttachmentIdsToRemove([]);
    };

    const isLikelyServerAttachmentId = (docId) =>
      Boolean(docId) && !/-doc-\d+$/.test(String(docId));

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
          attachmentIdsToRemove: editAttachmentIdsToRemove,
          token: user.token,
        });

        toast.success('Request updated successfully');
        setEditingRequest(null);
        setEditAttachments([]);
        setEditAttachmentIdsToRemove([]);
        await refreshMyRequestsData();
      } catch (error) {
        toast.error(userFacingErrorMessage(error, 'Could not save your changes.'));
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
        await refreshMyRequestsData();
      } catch (error) {
        toast.error(userFacingErrorMessage(error, 'Could not delete this request.'));
      } finally {
        setDeletingRequestId(null);
      }
    };

    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <Dialog open={Boolean(editingRequest)} onOpenChange={(open) => {
          if (!open) {
              setEditingRequest(null);
              setEditAttachments([]);
              setEditAttachmentIdsToRemove([]);
          }
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

              {editingRequest && (
                <div className="space-y-2 sm:col-span-2 rounded-xl border border-indigo-200/80 bg-gradient-to-br from-violet-50/90 to-indigo-50/80 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">AI estimation (reference)</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Est. budget</p>
                      <p className="text-sm font-semibold text-slate-900">{editingRequest.aiEstimatedCost}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Est. deadline</p>
                      <p className="text-sm font-semibold text-slate-900">{editingRequest.aiEstimatedDeadline}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Confidence</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {Number.isFinite(editingRequest.aiConfidence) ? `${editingRequest.aiConfidence}%` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

                {editAttachmentIdsToRemove.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Marked for removal (saved when you click Save)</p>
                    {(editingRequest?.documents || []).filter((d) => editAttachmentIdsToRemove.includes(d.id)).map((doc, idx) => (
                      <div key={`rm-${doc.id}`} className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white/90 p-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="truncate text-sm text-slate-700 line-through opacity-80">{doc.name || `Document ${idx + 1}`}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-900 hover:bg-amber-100"
                          onClick={() => setEditAttachmentIdsToRemove((prev) => prev.filter((id) => id !== doc.id))}
                        >
                          Undo
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {editingRequest?.documents?.filter((d) => !editAttachmentIdsToRemove.includes(d.id)).length > 0 && (
                  <div className="space-y-2 rounded-xl border border-indigo-200 bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Files</p>
                    {editingRequest.documents.filter((d) => !editAttachmentIdsToRemove.includes(d.id)).map((doc, idx) => (
                      <div key={doc.id} className="flex flex-col gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="truncate text-sm text-slate-700">{doc.name || `Document ${idx + 1}`}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-100" onClick={() => openDocument(doc.url)}>
                            View
                          </Button>
                          {isLikelyServerAttachmentId(doc.id) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => setEditAttachmentIdsToRemove((prev) => (prev.includes(doc.id) ? prev : [...prev, doc.id]))}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
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
                <p className="mt-1 text-sm text-slate-600">Posted {selectedRequest.createdAt}</p>
                <p className="mt-2 text-xs text-slate-500">All details, uploaded documents, and AI estimate insights in one view.</p>
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
                  <div className="rounded-xl border border-indigo-200/80 bg-white/90 p-3 transition-all duration-300 hover:shadow-sm sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Selected Vendor</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{selectedRequest.vendor || 'Not selected yet'}</p>
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
                <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
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
                <p className="text-2xl font-bold text-slate-900">{statusSummary.active}</p>
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
                <p className="text-2xl font-bold text-slate-900">{statusSummary.completed}</p>
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
                <p className="text-2xl font-bold text-slate-900">{statusSummary.pending}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
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
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending only</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="completed">Completed only</SelectItem>
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
                    <div className="mb-2 mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {request.category}
                      </span>
                    </div>
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      Posted {request.createdAt}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">{request.description}</p>
                  </div>
                </div>

                <div
                  className={`grid gap-4 mb-4 ${request.status === 'pending' ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}
                >
                  {request.status === 'pending' && (
                    <button
                      type="button"
                      className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                      onClick={() => navigate(`/client/proposals/${request.id}`, { state: { request } })}
                    >
                      <p className="text-sm font-semibold text-violet-700 mb-1">Proposals</p>
                      <p className="text-2xl font-black text-slate-900">{request.proposalsCount}</p>
                      <p className="text-xs text-slate-600 mt-1">View vendor offers for this request</p>
                    </button>
                  )}
                  <div
                    className={
                      request.status === 'pending'
                        ? 'md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3'
                        : 'rounded-xl border border-indigo-100 bg-indigo-50/60 p-3'
                    }
                  >
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                    onClick={() => openEditDialog(request)}
                    disabled={request.status !== 'pending'}
                    title={request.status !== 'pending' ? 'Only pending requests can be edited' : undefined}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setRequestPendingDelete(request)}
                    disabled={request.status !== 'pending' || deletingRequestId === request.id}
                    title={request.status !== 'pending' ? 'Only pending requests can be deleted' : undefined}
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
