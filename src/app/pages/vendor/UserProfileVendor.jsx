import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Eye,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Star,
  Upload,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
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
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useAuth } from '../../hooks/useAuth';
import { getMyDetailedProfileApi, upsertUserProfileApi } from '../../services/userProfileApi';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { toast } from '../../lib/toast';
import {
  ImagePreviewDialog,
  ProfilePhotoLightbox,
  getAccountStatusClasses,
  getAccountStatusLabel,
  getDisplayCompanyName,
} from '../../components/profile';
import { PROFILE_UPDATED_REALTIME_EVENT } from '../../context/SignalRContext';

const PROFILE_PIC_EVENT = 'corpserve:vendor-profile-picture-from-api';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/** Stable comparison for document URLs from API (trim; used for staged deletes). */
function normDocKey(v) {
  return String(v ?? '').trim();
}

function isAllowedSampleFile(file) {
  const mime = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  if (mime === 'application/pdf') return true;
  if (mime === 'application/msword') return true;
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
  return /\.(png|jpe?g|webp|gif|pdf|doc|docx)$/i.test(name);
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSampleFileKind(file) {
  const mime = String(file?.type || '').toLowerCase();
  return mime.startsWith('image/') ? 'image' : 'document';
}

function getDocumentKindLabel(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'PDF';
  if (name.endsWith('.docx')) return 'DOCX';
  if (name.endsWith('.doc')) return 'DOC';
  return 'Document';
}

function isImageDocType(documentType) {
  return String(documentType || '').toLowerCase().startsWith('image/');
}

function sampleFrameTone(index) {
  const tones = [
    'border-violet-300 bg-violet-50/35 dark:border-violet-400/35 dark:bg-violet-500/10',
    'border-cyan-300 bg-cyan-50/35 dark:border-cyan-400/35 dark:bg-cyan-500/10',
    'border-emerald-300 bg-emerald-50/35 dark:border-emerald-400/35 dark:bg-emerald-500/10',
    'border-amber-300 bg-amber-50/35 dark:border-amber-400/35 dark:bg-amber-500/10',
  ];
  return tones[index % tones.length];
}

function formatMoney(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 'EGP 0';
  return `EGP ${n.toLocaleString()}`;
}

function statTone(label) {
  const key = String(label).toLowerCase();
  if (key.includes('clients')) return 'text-blue-900 bg-blue-200 dark:text-blue-200 dark:bg-blue-500/22';
  if (key.includes('completed')) return 'text-emerald-900 bg-emerald-200 dark:text-emerald-200 dark:bg-emerald-500/22';
  return 'text-fuchsia-900 bg-fuchsia-200 dark:text-fuchsia-200 dark:bg-fuchsia-500/22';
}

function statCardWrapTone(index) {
  const tones = [
    'from-sky-200 via-blue-100 to-indigo-200 border-sky-300 shadow-sky-200/80 dark:from-sky-500/18 dark:via-blue-500/14 dark:to-indigo-500/20 dark:border-sky-400/35 dark:shadow-none',
    'from-emerald-200 via-teal-100 to-cyan-200 border-emerald-300 shadow-emerald-200/80 dark:from-emerald-500/18 dark:via-teal-500/14 dark:to-cyan-500/20 dark:border-emerald-400/35 dark:shadow-none',
    'from-fuchsia-200 via-pink-100 to-rose-200 border-fuchsia-300 shadow-fuchsia-200/80 dark:from-fuchsia-500/18 dark:via-pink-500/14 dark:to-rose-500/20 dark:border-fuchsia-400/35 dark:shadow-none',
  ];
  return tones[index % tones.length];
}

function statTextTone(index) {
  const tones = [
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-blue-700 dark:text-blue-200' },
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-emerald-700 dark:text-emerald-200' },
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-fuchsia-700 dark:text-fuchsia-200' },
  ];
  return tones[index % tones.length];
}

function normalizeStatusLabel(rawStatus) {
  const raw = String(rawStatus ?? '').trim().toLowerCase();
  if (raw === '1' || raw === 'pending' || raw === 'open') return 'Open';
  if (raw === '2' || raw === 'active' || raw === 'in progress' || raw === 'inprogress') return 'In Progress';
  if (raw === '3' || raw === 'completed' || raw === 'done' || raw === 'closed') return 'Completed';
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Open';
}

/**
 * Rebuild File[] for profile document upload, preserving existing server files.
 * @param {Array<Record<string, unknown>>} documents
 * @param {Set<string>} [excludeUrls]
 */
async function buildDocumentFilesFromDetails(documents) {
  const files = [];
  for (const d of documents) {
    const rawUrl = pick(d, 'documentUrl', 'DocumentUrl');
    const url = resolveMediaUrl(rawUrl);
    const name = pick(d, 'name', 'Name') || 'file';
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      const ct = pick(d, 'documentType', 'DocumentType') || blob.type || 'application/octet-stream';
      files.push(new File([blob], String(name), { type: ct }));
    } catch {
      /* skip unreadable */
    }
  }
  return files;
}

export default function UserProfileVendor() {
  const menuItems = useDashboardMenu('vendor');
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftValues, setDraftValues] = useState({ companyName: '', location: '', description: '' });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  /** Staged work-sample edits (applied only on Save; Cancel revokes). */
  const [pendingRemovedServerKeys, setPendingRemovedServerKeys] = useState(() => new Set());
  const [pendingNewSamples, setPendingNewSamples] = useState([]);
  const [imagePage, setImagePage] = useState(0);
  const [viewerSampleId, setViewerSampleId] = useState('');
  const [pendingDeleteSampleId, setPendingDeleteSampleId] = useState('');
  const photoInputRef = useRef(null);
  const samplesInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const raw = await getMyDetailedProfileApi(user.token);
      setDetails(raw && typeof raw === 'object' ? raw : null);
      setDraftValues({
        companyName: String(pick(raw, 'companyName', 'CompanyName') ?? ''),
        location: String(pick(raw, 'companyLocation', 'CompanyLocation') ?? ''),
        description: String(pick(raw, 'description', 'Description') ?? ''),
      });
    } catch (e) {
      toast.error(e?.message || 'Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onProfileUpdated = () => {
      if (isEditingProfile) return;
      load();
    };
    window.addEventListener(PROFILE_UPDATED_REALTIME_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_REALTIME_EVENT, onProfileUpdated);
  }, [load, isEditingProfile]);

  const fullName = String(pick(details, 'fullName', 'FullName') || user?.fullName || 'Vendor').trim();
  const vendorEmail = String(pick(details, 'email', 'Email') || user?.email || '');
  const pic = resolveMediaUrl(pick(details, 'profilePictureUrl', 'ProfilePictureUrl'));
  const accountStatusRaw = pick(details, 'accountStatus', 'AccountStatus');
  const accountStatusLabel = getAccountStatusLabel(accountStatusRaw);
  const accountStatusClasses = getAccountStatusClasses(accountStatusRaw);
  const isVendorVerified = Boolean(pick(details, 'isVendorVerified', 'IsVendorVerified'));
  const servedCategories = useMemo(() => {
    const raw = pick(details, 'servedCategories', 'ServedCategories');
    return Array.isArray(raw) ? raw.map((x) => String(x || '').trim()).filter(Boolean) : [];
  }, [details]);
  const vendorStars = pick(details, 'vendorStars', 'VendorStars');
  const ratingCount = pick(details, 'ratingCount', 'RatingCount');
  const workedWithClients = Number(pick(details, 'workingWithCount', 'WorkingWithCount') ?? 0);
  const completedCount = Number(pick(details, 'completedRequestsCount', 'CompletedRequestsCount') ?? 0);
  const totalEarnings = pick(details, 'totalEarnings', 'TotalEarnings');

  /** Company name from user profile only (editable here); never from vendor verification. */
  const companyDisplay = getDisplayCompanyName(pick(details, 'companyName', 'CompanyName'), fullName);
  const vendorLocation = String(pick(details, 'companyLocation', 'CompanyLocation') ?? '').trim();
  const vendorDescription = String(pick(details, 'description', 'Description') ?? '').trim();

  const syncHeader = (url) => {
    const r = resolveMediaUrl(url);
    if (r) window.dispatchEvent(new CustomEvent(PROFILE_PIC_EVENT, { detail: { url: r } }));
  };

  const documents = useMemo(
    () => (Array.isArray(pick(details, 'documents', 'Documents')) ? pick(details, 'documents', 'Documents') : []),
    [details],
  );

  const resetSampleDraftState = useCallback(() => {
    setPendingRemovedServerKeys(new Set());
    setPendingNewSamples((prev) => {
      for (const p of prev) {
        if (p.url) URL.revokeObjectURL(p.url);
      }
      return [];
    });
  }, []);

  const startEditingProfile = () => {
    resetSampleDraftState();
    setDraftValues({
      companyName: String(pick(details, 'companyName', 'CompanyName') ?? ''),
      location: String(pick(details, 'companyLocation', 'CompanyLocation') ?? ''),
      description: String(pick(details, 'description', 'Description') ?? ''),
    });
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    resetSampleDraftState();
    setDraftValues({
      companyName: String(pick(details, 'companyName', 'CompanyName') ?? ''),
      location: String(pick(details, 'companyLocation', 'CompanyLocation') ?? ''),
      description: String(pick(details, 'description', 'Description') ?? ''),
    });
    setIsEditingProfile(false);
  };

  const saveEditingProfile = async () => {
    if (!user?.token) return;
    setIsSavingProfile(true);
    try {
      const remainingDocs = documents.filter((d) => {
        const key = normDocKey(pick(d, 'documentUrl', 'DocumentUrl'));
        return !pendingRemovedServerKeys.has(key);
      });
      const existingFiles = await buildDocumentFilesFromDetails(remainingDocs);
      const stagedNewFiles = pendingNewSamples.map((p) => p.file);
      await upsertUserProfileApi({
        companyName: draftValues.companyName,
        companyLocation: draftValues.location,
        description: draftValues.description,
        documentFiles: [...existingFiles, ...stagedNewFiles],
        token: user.token,
      });
      toast.success('Profile updated successfully.');
      resetSampleDraftState();
      setIsEditingProfile(false);
      await load();
    } catch (e) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const sampleItems = useMemo(() => {
    return documents.map((d, index) => {
      const rawUrl = pick(d, 'documentUrl', 'DocumentUrl');
      const url = resolveMediaUrl(rawUrl);
      const name = String(pick(d, 'name', 'Name') || 'File');
      const documentType = pick(d, 'documentType', 'DocumentType');
      const kind = isImageDocType(documentType) ? 'image' : 'document';
      const id = `${String(rawUrl || '')}-${index}`;
      return {
        id,
        url,
        name,
        kind,
        documentType: String(documentType || ''),
        serverKey: String(rawUrl ?? ''),
      };
    });
  }, [documents]);

  const effectiveSampleItems = useMemo(() => {
    if (!isEditingProfile) {
      return sampleItems;
    }
    const serverItems = documents
      .filter((d) => {
        const key = normDocKey(pick(d, 'documentUrl', 'DocumentUrl'));
        return !pendingRemovedServerKeys.has(key);
      })
      .map((d, index) => {
        const rawUrl = pick(d, 'documentUrl', 'DocumentUrl');
        const url = resolveMediaUrl(rawUrl);
        const name = String(pick(d, 'name', 'Name') || 'File');
        const documentType = pick(d, 'documentType', 'DocumentType');
        const kind = isImageDocType(documentType) ? 'image' : 'document';
        const id = `${String(rawUrl || '')}-${index}`;
        return {
          id,
          url,
          name,
          kind,
          documentType: String(documentType || ''),
          serverKey: normDocKey(rawUrl),
        };
      })
      .filter((item) => item.url);

    const localItems = pendingNewSamples.map((p) => ({
      id: p.id,
      url: p.url,
      name: p.file.name,
      kind: getSampleFileKind(p.file),
      documentType: String(p.file.type || ''),
      serverKey: '',
    }));

    return [...serverItems, ...localItems];
  }, [isEditingProfile, documents, sampleItems, pendingRemovedServerKeys, pendingNewSamples]);

  const imageSamples = useMemo(
    () => effectiveSampleItems.filter((s) => s.kind === 'image' && s.url),
    [effectiveSampleItems],
  );
  const documentSamples = useMemo(
    () => effectiveSampleItems.filter((s) => s.kind === 'document' && s.url),
    [effectiveSampleItems],
  );

  const imagePageSize = 4;
  const imagePageCount = Math.max(1, Math.ceil(imageSamples.length / imagePageSize));

  const pagedImageSamples = useMemo(() => {
    const start = imagePage * imagePageSize;
    return imageSamples.slice(start, start + imagePageSize);
  }, [imagePage, imageSamples]);

  useEffect(() => {
    if (imagePage > imagePageCount - 1) {
      setImagePage(Math.max(0, imagePageCount - 1));
    }
  }, [imagePage, imagePageCount]);

  const selectedImageSample = useMemo(
    () => imageSamples.find((item) => item.id === viewerSampleId) || null,
    [imageSamples, viewerSampleId],
  );

  const pendingDeleteSample = useMemo(
    () => effectiveSampleItems.find((item) => item.id === pendingDeleteSampleId) || null,
    [effectiveSampleItems, pendingDeleteSampleId],
  );

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const openSamplesPicker = () => {
    samplesInputRef.current?.click();
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.token) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file only.');
      event.target.value = '';
      return;
    }
    const maxSizeInBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error('Image size must be 3MB or less.');
      event.target.value = '';
      return;
    }
    setIsUploadingPhoto(true);
    try {
      await upsertUserProfileApi({ profilePicture: file, token: user.token });
      toast.success('Profile photo updated successfully.');
      await load();
      const next = await getMyDetailedProfileApi(user.token);
      syncHeader(pick(next, 'profilePictureUrl', 'ProfilePictureUrl'));
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const handleSamplesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !isEditingProfile) return;

    const validFiles = files.filter((file) => isAllowedSampleFile(file));
    if (validFiles.length !== files.length) {
      toast.error('Only images, PDF, DOC, and DOCX files are allowed.');
    }
    const maxSizeInBytes = 10 * 1024 * 1024;
    const sizeAccepted = validFiles.filter((file) => file.size <= maxSizeInBytes);
    if (sizeAccepted.length !== validFiles.length) {
      toast.error('Each file must be 10MB or less.');
    }
    if (!sizeAccepted.length) return;

    const newId = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random()}`;

    setPendingNewSamples((prev) => {
      const next = [...prev];
      for (const file of sizeAccepted) {
        next.push({
          id: `local-${newId()}`,
          file,
          url: URL.createObjectURL(file),
        });
      }
      return next;
    });
  };

  const confirmDeleteSample = () => {
    const id = pendingDeleteSampleId;
    if (!id) return;
    const target = effectiveSampleItems.find((item) => item.id === id);
    if (!target) {
      setPendingDeleteSampleId('');
      return;
    }
    setPendingDeleteSampleId('');
    if (viewerSampleId === id) {
      setViewerSampleId('');
    }

    const isStagedOnly = id.startsWith('local-');
    if (isStagedOnly) {
      setPendingNewSamples((prev) => {
        const victim = prev.find((p) => p.id === id);
        if (victim?.url) URL.revokeObjectURL(victim.url);
        return prev.filter((p) => p.id !== id);
      });
      return;
    }

    const k = normDocKey(target.serverKey);
    if (k) {
      setPendingRemovedServerKeys((prev) => new Set([...prev, k]));
    }
  };

  const viewDocumentSample = (item) => {
    if (!item?.url) {
      toast.error('Unable to preview this file right now.');
      return;
    }
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const recentFromApi = useMemo(() => {
    const rows = Array.isArray(pick(details, 'recentRequests', 'RecentRequests'))
      ? pick(details, 'recentRequests', 'RecentRequests')
      : [];
    return rows.map((row) => {
      const statusLabel = normalizeStatusLabel(pick(row, 'status', 'Status'));
      const price = pick(row, 'price', 'Price', 'budgetMax', 'BudgetMax', 'budgetMin', 'BudgetMin');
      return {
        id: pick(row, 'requestId', 'RequestId') || pick(row, 'id', 'Id'),
        title: pick(row, 'requestTitle', 'RequestTitle') || 'Request',
        client: pick(row, 'clientName', 'ClientName') || 'Client',
        amount: Number(price ?? 0),
        rating: pick(row, 'rating', 'Rating') != null ? Number(pick(row, 'rating', 'Rating')) : null,
        taskState: String(pick(row, 'status', 'Status') || 'In Progress'),
        status: statusLabel,
        date: pick(row, 'createdAt', 'CreatedAt'),
      };
    });
  }, [details]);

  const stats = useMemo(
    () => [
      { label: 'Worked With Clients', value: workedWithClients, icon: Users },
      { label: 'Completed Requests', value: completedCount, icon: CheckCircle2 },
      { label: 'Total Earnings', value: formatMoney(totalEarnings), icon: Wallet },
    ],
    [workedWithClients, completedCount, totalEarnings],
  );

  const averageRating = useMemo(() => {
    const n = Number(vendorStars);
    if (vendorStars != null && vendorStars !== '' && Number.isFinite(n)) return n.toFixed(1);
    return '0.0';
  }, [vendorStars]);

  const ratingCountDisplay =
    ratingCount != null && ratingCount !== '' && Number.isFinite(Number(ratingCount)) ? Number(ratingCount) : null;

  const hasVendorAvatar = Boolean(String(pic || '').trim());
  const totalSamples = imageSamples.length + documentSamples.length;

  if (loading && !details) {
    return (
      <DashboardLayout menuItems={menuItems} userRole="vendor">
        <div className="cs-profile-shell relative mx-auto flex min-h-[40vh] w-full max-w-6xl items-center justify-center overflow-x-hidden pb-8">
          <p className="text-center text-slate-600 dark:text-slate-300">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="cs-profile-shell relative mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden pb-8">
        <div className="cs-profile-orb-a pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-500/12" />
        <div className="cs-profile-orb-b pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl dark:bg-cyan-500/10" />
        <div className="cs-profile-orb-c pointer-events-none absolute bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-300/10 blur-3xl dark:bg-indigo-500/10" />

        <section
          className="cs-profile-hero cs-profile-section-reveal overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_16px_34px_rgba(99,102,241,0.12)] dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-[#131d37] dark:via-[#1a2a4d] dark:to-[#1e3a62] dark:shadow-[0_20px_44px_rgba(2,6,23,0.58)]"
          style={{ animationDelay: '30ms' }}
        >
          <div className="h-16 bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6]" />
          <div className="px-4 pb-5 pt-0 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="-mt-10 flex flex-col items-start gap-2">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-lg shadow-indigo-200 dark:border-slate-900 dark:shadow-[0_14px_30px_rgba(2,6,23,0.56)]">
                  <ProfilePhotoLightbox
                    src={pic}
                    wrapperClassName="cs-profile-avatar-bob h-full w-full"
                    imgClassName="cs-profile-image-thumb cs-profile-image-glow h-full w-full object-cover"
                    fallback={
                      <div className="cs-profile-avatar-bob flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100 shadow-lg shadow-indigo-200 dark:from-indigo-500/24 dark:to-blue-500/20 dark:shadow-[0_14px_30px_rgba(2,6,23,0.56)]">
                        <Building2 className="h-9 w-9 text-indigo-700 dark:text-indigo-200" />
                      </div>
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={isUploadingPhoto}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-indigo-400/35 dark:bg-slate-900/80 dark:text-indigo-200 dark:hover:bg-indigo-500/18"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading...' : hasVendorAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
              </div>
              <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                {isVendorVerified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/16 dark:text-emerald-200">
                    <CircleDot className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <CircleDot className="h-3 w-3" /> Unverified
                  </span>
                )}
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${accountStatusClasses}`}>
                  <CircleDot className="h-3 w-3" /> Account: {accountStatusLabel}
                </span>
                {isVendorVerified && servedCategories.length > 0
                  ? servedCategories.map((name, i) => (
                      <span
                        key={`${name}-${i}`}
                        className="max-w-[min(100%,14rem)] truncate rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/16 dark:text-violet-200"
                        title={name}
                      >
                        {name}
                      </span>
                    ))
                  : null}
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={startEditingProfile}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-400/35 dark:bg-indigo-500/16 dark:text-indigo-200 dark:hover:bg-indigo-500/24"
                  >
                    <Pencil className="h-3 w-3" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`break-words text-2xl font-black tracking-tight sm:text-3xl ${fullName ? 'text-slate-900 dark:text-slate-100' : 'italic text-slate-500 dark:text-slate-400'}`}
                >
                  {fullName || 'Add your name in profile settings'}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/16 dark:text-amber-200">
                  <Star className="h-3 w-3 fill-current" /> {averageRating} Rating
                  {ratingCountDisplay != null && ratingCountDisplay > 0 ? (
                    <span className="font-normal text-amber-800/90 dark:text-amber-200/80">({ratingCountDisplay})</span>
                  ) : null}
                </span>
              </div>

              <div className="mt-3 space-y-3 text-sm text-slate-500 dark:text-slate-300">
                {isEditingProfile ? (
                  <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-400/30 dark:bg-indigo-500/12">
                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-200">
                        <Building2 className="h-3.5 w-3.5" /> Company Name
                      </label>
                      <Input
                        value={draftValues.companyName}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Add your company name"
                        className="h-9 bg-white dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-200">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </label>
                      <Input
                        value={draftValues.location}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Add your location"
                        className="h-9 bg-white dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-200">
                        <FileText className="h-3.5 w-3.5" /> Description
                      </label>
                      <Textarea
                        value={draftValues.description}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Add your company description"
                        className="bg-white dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-violet-500" />
                        {vendorEmail || <span className="italic text-slate-400 dark:text-slate-500">Add your email from settings</span>}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-indigo-500" />
                        <span className={companyDisplay ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}>
                          {companyDisplay || 'Add your company name'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-sky-500" />
                        <span className={vendorLocation ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}>
                          {vendorLocation || 'Add your location'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <FileText className="mt-0.5 h-4 w-4 text-fuchsia-500" />
                      <p className={vendorDescription ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}>
                        {vendorDescription || 'Add your company description'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="cs-profile-section-reveal grid grid-cols-2 gap-3 md:grid-cols-3" style={{ animationDelay: '70ms' }}>
          {stats.map((item, index) => {
            const Icon = item.icon;
            const textTone = statTextTone(index);
            return (
              <article
                key={item.label}
                className={`cs-profile-stat-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${statCardWrapTone(index)}`}
                style={{ animationDelay: `${100 + index * 55}ms` }}
              >
                <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/35 blur-xl" />
                <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white/75 ${statTone(item.label)}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className={`text-[28px] font-black leading-none ${textTone.value}`}>{item.value}</p>
                <p className={`mt-2 text-sm font-semibold ${textTone.label}`}>{item.label}</p>
              </article>
            );
          })}
        </section>

        <section
          className="cs-profile-section-reveal rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 shadow-[0_10px_24px_rgba(79,70,229,0.12)] sm:p-5 dark:border-indigo-400/30 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/92 dark:to-indigo-950/35 dark:shadow-none"
          style={{ animationDelay: '110ms' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">Upload Work Samples (Optional)</h2>
              <p className="mt-1 text-sm text-indigo-700/80 dark:text-indigo-200/80">
                {isEditingProfile
                  ? 'Add or remove files below; nothing is saved until you tap Save. Cancel discards all changes.'
                  : 'Uploaded work samples are shown below.'}
              </p>
            </div>
            {isEditingProfile && totalSamples > 0 ? (
              <button
                type="button"
                onClick={openSamplesPicker}
                disabled={isSavingProfile}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-400/35 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-500/18 dark:shadow-none"
              >
                <Upload className="h-3.5 w-3.5" /> Add files
              </button>
            ) : null}
          </div>

          {isEditingProfile ? (
            <input
              ref={samplesInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleSamplesSelected}
            />
          ) : null}

          {isEditingProfile && totalSamples === 0 && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-indigo-300/70 bg-white/80 p-4 text-center dark:border-indigo-400/35 dark:bg-slate-900/80">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Drag and drop files or choose from your device</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Allowed: images, PDF, DOC, DOCX - max 10MB per file</p>
              <button
                type="button"
                onClick={openSamplesPicker}
                disabled={isSavingProfile}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-400/35 dark:bg-indigo-500/16 dark:text-indigo-200 dark:hover:bg-indigo-500/24"
              >
                <Upload className="h-4 w-4" /> Upload Files
              </button>
            </div>
          )}

          {imageSamples.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Image Samples</h3>
                {imagePageCount > 1 && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-1.5 py-1 dark:border-indigo-400/35 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setImagePage((prev) => Math.max(0, prev - 1))}
                      disabled={imagePage === 0}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-indigo-200 dark:hover:bg-indigo-500/18 dark:disabled:text-slate-600"
                      title="Previous images"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {imagePage + 1} / {imagePageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagePage((prev) => Math.min(imagePageCount - 1, prev + 1))}
                      disabled={imagePage >= imagePageCount - 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-indigo-200 dark:hover:bg-indigo-500/18 dark:disabled:text-slate-600"
                      title="Next images"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {pagedImageSamples.map((item, index) => (
                  <article
                    key={item.id}
                    className={`cs-profile-image-card overflow-hidden rounded-xl border-2 shadow-sm ${sampleFrameTone(imagePage * imagePageSize + index)}`}
                    style={{ animationDelay: `${40 + index * 55}ms` }}
                  >
                    <button type="button" onClick={() => setViewerSampleId(item.id)} className="group relative block w-full">
                      <img src={item.url} alt={item.name} className="cs-profile-image-thumb h-36 w-full object-cover" />
                      <span className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <Eye className="h-3.5 w-3.5" /> View
                      </span>
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t border-white/70 bg-white/85 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/85">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Portfolio file</p>
                      </div>
                      {isEditingProfile && (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteSampleId(item.id)}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 transition hover:bg-rose-200"
                          title="Delete sample"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {documentSamples.length > 0 && (
            <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Document Samples</h3>
              <div className="space-y-2">
                {documentSamples.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white px-3 py-2 dark:border-indigo-400/30 dark:bg-slate-900">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.documentType && !isImageDocType(item.documentType)
                          ? String(item.documentType).split('/').pop()
                          : getDocumentKindLabel({ name: item.name })}
                        {' • '}
                        Portfolio file
                      </p>
                    </div>
                    <div className="ml-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => viewDocumentSample(item)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-400/35 dark:bg-indigo-500/16 dark:text-indigo-200 dark:hover:bg-indigo-500/24"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {isEditingProfile && (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteSampleId(item.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 transition hover:bg-rose-200"
                          title="Delete sample"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEditingProfile && totalSamples === 0 && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No work samples uploaded yet.</p>}
          {isSavingProfile ? <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">Saving profile…</p> : null}
        </section>

        {isEditingProfile && (
          <section className="cs-profile-section-reveal flex flex-wrap items-center justify-end gap-2" style={{ animationDelay: '150ms' }}>
            <button
              type="button"
              onClick={cancelEditingProfile}
              disabled={isSavingProfile}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={saveEditingProfile}
              disabled={isSavingProfile}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-100 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/18 dark:text-emerald-200 dark:hover:bg-emerald-500/28"
            >
              <Check className="h-4 w-4" /> {isSavingProfile ? 'Saving…' : 'Save'}
            </button>
          </section>
        )}

        <section className="cs-profile-section-reveal rounded-2xl border border-slate-200 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/74 dark:shadow-none" style={{ animationDelay: '180ms' }}>
          <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Requests</h2>
          </div>

          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 sm:px-5">Loading recent requests...</div>
          )}

          {!loading && recentFromApi.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 sm:px-5">No recent requests yet.</div>
          )}

          {!loading && recentFromApi.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentFromApi.map((request) => (
                <article
                  key={String(request?.id || request?.title)}
                  className="grid grid-cols-1 gap-1.5 px-4 py-2.5 transition-colors hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-cyan-50/40 dark:hover:from-violet-500/12 dark:hover:to-cyan-500/10 sm:grid-cols-12 sm:items-center sm:px-5"
                >
                  <div className="sm:col-span-7">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        request?.status === 'Completed'
                          ? 'border border-violet-200 bg-violet-50 text-violet-700'
                          : 'border border-sky-200 bg-sky-50 text-sky-700'
                      }`}
                    >
                      {request?.status === 'Completed' ? 'Completed' : 'In Progress'}
                    </span>
                    <h3 className="mt-0.5 text-base font-medium tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">{request?.title || 'Request'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                      {request?.client || 'Client'} • {formatDate(request?.date)}
                    </p>
                  </div>

                  <div className="text-left sm:col-span-2 sm:text-right">
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200 sm:text-xl">{formatMoney(request?.amount)}</p>
                  </div>

                  <div className="sm:col-span-3 sm:text-right">
                    {request?.status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-sm text-amber-700">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {request?.rating != null && Number.isFinite(Number(request.rating)) ? Number(request.rating).toFixed(1) : '—'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-sm text-sky-700">
                        {request?.taskState || 'In Progress'}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          className="cs-profile-section-reveal relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#5b5cf0] to-[#2f7de1] px-4 py-4 text-white shadow-[0_12px_24px_rgba(79,70,229,0.24)] sm:px-5 sm:py-4 dark:from-[#4c1d95] dark:via-[#3730a3] dark:to-[#1d4ed8] dark:shadow-[0_16px_32px_rgba(2,6,23,0.58)]"
          style={{ animationDelay: '220ms' }}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs opacity-90">You have worked with</p>
              <p className="text-2xl font-black leading-none sm:text-3xl">
                {workedWithClients} Client{workedWithClients === 1 ? '' : 's'}
              </p>
            </div>
            <span className="inline-flex w-full items-center justify-center rounded-xl bg-white/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur sm:w-auto">
              Vendor Profile
            </span>
          </div>
        </section>

        <ImagePreviewDialog
          open={Boolean(selectedImageSample)}
          onOpenChange={(next) => {
            if (!next) setViewerSampleId('');
          }}
          imageSrc={selectedImageSample?.url || ''}
          imageAlt={selectedImageSample?.name || ''}
        />

        <AlertDialog
          open={Boolean(pendingDeleteSampleId)}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteSampleId('');
          }}
        >
          <AlertDialogContent className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this sample?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteSample?.name
                  ? `Remove “${pendingDeleteSample.name}” from the list? Nothing is saved to the server until you tap Save.`
                  : 'Remove this file from the list? Nothing is saved to the server until you tap Save.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSample} className="bg-rose-600 text-white hover:bg-rose-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
