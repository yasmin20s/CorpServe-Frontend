import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Eye, FileText, Mail, MapPin, Pencil, Star, Upload, Users, Wallet, X } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useAuth } from '../../hooks/useAuth';
import { getVendorCompletedRequestsApi, getVendorActiveRequestsApi } from '../../services/proposalsApi';
import { getVendorVerificationStatusApi } from '../../services/vendorVerifyApi';
import { toast } from '../../lib/toast';

const VENDOR_PROFILE_STORAGE_PREFIX = 'corpserve-vendor-profile';
const PROFILE_AVATAR_UPDATED_EVENT = 'corpserve:vendor-profile-avatar-updated';

function formatFileSize(bytes) {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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

function sampleFrameTone(index) {
  const tones = [
    'border-violet-300 bg-violet-50/35',
    'border-cyan-300 bg-cyan-50/35',
    'border-emerald-300 bg-emerald-50/35',
    'border-amber-300 bg-amber-50/35',
  ];
  return tones[index % tones.length];
}

function formatMoney(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '$0';
  return `$${n.toLocaleString()}`;
}

function statTone(label) {
  const key = String(label).toLowerCase();
  if (key.includes('clients')) return 'text-blue-900 bg-blue-200';
  if (key.includes('completed')) return 'text-emerald-900 bg-emerald-200';
  return 'text-fuchsia-900 bg-fuchsia-200';
}

function statCardWrapTone(index) {
  const tones = [
    'from-sky-200 via-blue-100 to-indigo-200 border-sky-300 shadow-sky-200/80',
    'from-emerald-200 via-teal-100 to-cyan-200 border-emerald-300 shadow-emerald-200/80',
    'from-fuchsia-200 via-pink-100 to-rose-200 border-fuchsia-300 shadow-fuchsia-200/80',
  ];
  return tones[index % tones.length];
}

function statTextTone(index) {
  const tones = [
    { value: 'text-slate-900', label: 'text-blue-700' },
    { value: 'text-slate-900', label: 'text-emerald-700' },
    { value: 'text-slate-900', label: 'text-fuchsia-700' },
  ];
  return tones[index % tones.length];
}

export default function UserProfileVendor() {
  const menuItems = useDashboardMenu('vendor');
  const { user } = useAuth();
  const [organizationName, setOrganizationName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorLocation, setVendorLocation] = useState('');
  const [vendorDescription, setVendorDescription] = useState('');
  const [vendorAvatar, setVendorAvatar] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftValues, setDraftValues] = useState({ companyName: '', location: '', description: '' });
  const [sampleFiles, setSampleFiles] = useState([]);
  const [sampleFilesSnapshot, setSampleFilesSnapshot] = useState([]);
  const [imagePage, setImagePage] = useState(0);
  const [viewerSampleId, setViewerSampleId] = useState('');
  const [pendingDeleteSampleId, setPendingDeleteSampleId] = useState('');
  const [completedRequests, setCompletedRequests] = useState([]);
  const [activeRequestsForRecent, setActiveRequestsForRecent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const photoInputRef = useRef(null);
  const samplesInputRef = useRef(null);
  const sampleFilesRef = useRef([]);

  const profileStorageKey = useMemo(() => {
    const normalizedEmail = String(user?.email || 'guest').trim().toLowerCase();
    return `${VENDOR_PROFILE_STORAGE_PREFIX}:${normalizedEmail}`;
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;

    const loadVendorProfile = async () => {
      if (!user?.token) {
        if (mounted) {
          setIsProfileHydrated(false);
          setIsEditingProfile(false);
          setOrganizationName('');
          setVendorEmail('');
          setVendorLocation('');
          setVendorDescription('');
          setVendorAvatar('');
          setCompletedRequests([]);
          setActiveRequestsForRecent([]);
          setIsLoading(false);
        }
        return;
      }

      let persistedProfile = {};
      try {
        const raw = localStorage.getItem(profileStorageKey);
        persistedProfile = raw ? (JSON.parse(raw) || {}) : {};
      } catch {
        persistedProfile = {};
      }

      const localLocation = String(persistedProfile?.location || '').trim();
      const localDescription = String(persistedProfile?.description || '').trim();
      const localAvatar = String(persistedProfile?.avatar || '').trim();
      const localCompanyName = String(persistedProfile?.companyName || '').trim();

      setIsProfileHydrated(false);
      setIsLoading(true);
      try {
        const [verificationStatus, completed, activeRequests] = await Promise.all([
          getVendorVerificationStatusApi(user.token),
          getVendorCompletedRequestsApi({ token: user.token }),
          getVendorActiveRequestsApi({ token: user.token, pageIndex: 1, pageSize: 20 }),
        ]);

        const normalizedOrgName = String(verificationStatus?.organizationName || '').trim();
        const normalizedLocation = String(
          verificationStatus?.location
            ?? verificationStatus?.address
            ?? verificationStatus?.city
            ?? verificationStatus?.organizationLocation
            ?? '',
        ).trim();
        const normalizedDescription = String(
          verificationStatus?.description
            ?? verificationStatus?.about
            ?? verificationStatus?.organizationDescription
            ?? '',
        ).trim();
        const completedList = Array.isArray(completed) ? [...completed] : [];
        const activeList = Array.isArray(activeRequests?.data) ? [...activeRequests.data] : [];
        completedList.sort((a, b) => {
          const dateA = new Date(a?.completedDate || 0).getTime();
          const dateB = new Date(b?.completedDate || 0).getTime();
          return dateB - dateA;
        });

        if (!mounted) return;
        setOrganizationName(localCompanyName || normalizedOrgName);
        setVendorEmail(String(user?.email || '').trim());
        setVendorLocation(localLocation || normalizedLocation);
        setVendorDescription(localDescription || normalizedDescription);
        setVendorAvatar(localAvatar);
        setCompletedRequests(completedList);
        setActiveRequestsForRecent(activeList);
        setIsProfileHydrated(true);
      } catch (error) {
        if (!mounted) return;
        setOrganizationName('');
        setVendorEmail(String(user?.email || '').trim());
        setVendorLocation(localLocation);
        setVendorDescription(localDescription);
        setVendorAvatar(localAvatar);
        setCompletedRequests([]);
        setActiveRequestsForRecent([]);
        setIsProfileHydrated(true);
        toast.error(error?.message || 'Failed to load vendor profile data');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadVendorProfile();

    return () => {
      mounted = false;
    };
  }, [user?.token, user?.email, profileStorageKey]);

  useEffect(() => {
    sampleFilesRef.current = sampleFiles;
  }, [sampleFiles]);

  useEffect(() => {
    return () => {
      sampleFilesRef.current.forEach((item) => {
        if (item?.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!user?.token || !isProfileHydrated) return;

    const payload = {
      companyName: organizationName,
      location: vendorLocation,
      description: vendorDescription,
      avatar: vendorAvatar,
    };
    localStorage.setItem(profileStorageKey, JSON.stringify(payload));
  }, [user?.token, isProfileHydrated, organizationName, vendorEmail, vendorLocation, vendorDescription, vendorAvatar, profileStorageKey]);

  const recentRequests = useMemo(() => {
    const completed = completedRequests.map((item) => ({
      id: String(item?.id || item?.requestId || item?.title || ''),
      title: item?.title || 'Request',
      client: item?.client || 'Client',
      amount: Number(item?.amount || 0),
      rating: Number(item?.rating || 0),
      taskState: 'Completed',
      status: 'Completed',
      date: item?.completedDate || '',
    }));

    const inProgress = activeRequestsForRecent.map((item) => ({
      id: String(item?.requestId || item?.title || ''),
      title: item?.title || 'Request',
      client: item?.clientName || 'Client',
      amount: Number(item?.price || 0),
      rating: null,
      taskState: item?.taskState || 'In Progress',
      status: 'In Progress',
      date: item?.deadline || '',
    }));

    const timestamp = (value) => {
      const parsed = new Date(value || 0).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return [...completed, ...inProgress]
      .sort((a, b) => timestamp(b.date) - timestamp(a.date))
      .slice(0, 4);
  }, [activeRequestsForRecent, completedRequests]);

  const totalRating = useMemo(
    () => completedRequests.reduce((sum, item) => sum + Number(item?.rating || 0), 0),
    [completedRequests],
  );

  const workedWithClients = useMemo(
    () => new Set(completedRequests.map((item) => String(item?.client || '').trim()).filter(Boolean)).size,
    [completedRequests],
  );

  const stats = useMemo(() => {
    const totalCompleted = completedRequests.length;
    const totalEarnings = completedRequests.reduce((sum, item) => sum + Number(item?.amount || 0), 0);

    return [
      { label: 'Worked With Clients', value: workedWithClients, icon: Users },
      { label: 'Completed Requests', value: totalCompleted, icon: CheckCircle2 },
      { label: 'Total Earnings', value: formatMoney(totalEarnings), icon: Wallet },
    ];
  }, [completedRequests, workedWithClients]);

  const averageRating = useMemo(() => {
    if (completedRequests.length === 0) return '0.0';
    return (totalRating / completedRequests.length).toFixed(1);
  }, [completedRequests.length, totalRating]);

  const imageSamples = useMemo(
    () => sampleFiles.filter((item) => item.kind === 'image'),
    [sampleFiles],
  );

  const documentSamples = useMemo(
    () => sampleFiles.filter((item) => item.kind === 'document'),
    [sampleFiles],
  );

  const imagePageSize = 4;
  const imagePageCount = Math.max(1, Math.ceil(imageSamples.length / imagePageSize));

  const pagedImageSamples = useMemo(() => {
    const start = imagePage * imagePageSize;
    return imageSamples.slice(start, start + imagePageSize);
  }, [imagePage, imageSamples]);

  const selectedImageSample = useMemo(
    () => sampleFiles.find((item) => item.id === viewerSampleId && item.kind === 'image') || null,
    [sampleFiles, viewerSampleId],
  );

  const pendingDeleteSample = useMemo(
    () => sampleFiles.find((item) => item.id === pendingDeleteSampleId) || null,
    [sampleFiles, pendingDeleteSampleId],
  );

  useEffect(() => {
    if (imagePage > imagePageCount - 1) {
      setImagePage(Math.max(0, imagePageCount - 1));
    }
  }, [imagePage, imagePageCount]);

  const startEditingProfile = () => {
    setDraftValues({
      companyName: organizationName,
      location: vendorLocation,
      description: vendorDescription,
    });
    setSampleFilesSnapshot(sampleFiles.map((item) => ({ ...item })));
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    const snapshotIds = new Set(sampleFilesSnapshot.map((item) => item.id));
    sampleFiles.forEach((item) => {
      if (!snapshotIds.has(item.id) && item?.url) {
        URL.revokeObjectURL(item.url);
      }
    });

    setSampleFiles(sampleFilesSnapshot.map((item) => ({ ...item })));
    setSampleFilesSnapshot([]);
    setPendingDeleteSampleId('');
    setIsEditingProfile(false);
  };

  const saveEditingProfile = () => {
    setOrganizationName(String(draftValues.companyName || '').trim());
    setVendorLocation(String(draftValues.location || '').trim());
    setVendorDescription(String(draftValues.description || '').trim());
    setSampleFilesSnapshot([]);
    setIsEditingProfile(false);
    toast.success('Profile updated successfully.');
  };

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const openSamplesPicker = () => {
    samplesInputRef.current?.click();
  };

  const handleSamplesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => isAllowedSampleFile(file));
    if (validFiles.length !== files.length) {
      toast.error('Only images, PDF, DOC, and DOCX files are allowed.');
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    const sizeAccepted = validFiles.filter((file) => file.size <= maxSizeInBytes);
    if (sizeAccepted.length !== validFiles.length) {
      toast.error('Each file must be 10MB or less.');
    }

    setSampleFiles((prev) => {
      const known = new Set(prev.map((item) => item.id));
      const next = [...prev];

      sizeAccepted.forEach((file) => {
        const id = `${file.name}-${file.size}-${file.lastModified}`;
        if (!known.has(id)) {
          next.push({
            id,
            file,
            kind: getSampleFileKind(file),
            url: URL.createObjectURL(file),
          });
          known.add(id);
        }
      });

      return next;
    });

    event.target.value = '';
  };

  const removeSampleFile = (id) => {
    setSampleFiles((prev) => {
      let removedUrl = '';
      const next = prev.filter((item) => {
        if (item.id === id) {
          removedUrl = item.url || '';
          return false;
        }
        return true;
      });
      if (removedUrl) {
        URL.revokeObjectURL(removedUrl);
      }
      return next;
    });

    if (viewerSampleId === id) {
      setViewerSampleId('');
    }
  };

  const requestDeleteSample = (id) => {
    setPendingDeleteSampleId(id);
  };

  const confirmDeleteSample = () => {
    if (!pendingDeleteSampleId) return;
    removeSampleFile(pendingDeleteSampleId);
    setPendingDeleteSampleId('');
    toast.success('Sample removed.');
  };

  const viewDocumentSample = (id) => {
    const sample = sampleFiles.find((item) => item.id === id);
    if (!sample?.url) {
      toast.error('Unable to preview this file right now.');
      return;
    }
    window.open(sample.url, '_blank', 'noopener,noreferrer');
  };

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    const reader = new FileReader();

    reader.onload = () => {
      const imageData = typeof reader.result === 'string' ? reader.result : '';
      if (!imageData) {
        toast.error('Failed to upload image. Please try again.');
        setIsUploadingPhoto(false);
        return;
      }

      setVendorAvatar(imageData);
      window.dispatchEvent(new CustomEvent(PROFILE_AVATAR_UPDATED_EVENT, {
        detail: {
          email: String(user?.email || '').trim().toLowerCase(),
          avatar: imageData,
        },
      }));
      toast.success('Profile photo updated successfully.');
      setIsUploadingPhoto(false);
    };

    reader.onerror = () => {
      toast.error('Failed to read image file.');
      setIsUploadingPhoto(false);
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const vendorDisplayName = organizationName || 'Add your organization name in Vendor Verification';
  const hasVendorAvatar = Boolean(String(vendorAvatar || '').trim());

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="cs-profile-shell relative mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden pb-8">
        <div className="cs-profile-orb-a pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="cs-profile-orb-b pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="cs-profile-orb-c pointer-events-none absolute bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-300/10 blur-3xl" />

        <section className="cs-profile-hero cs-profile-section-reveal overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_16px_34px_rgba(99,102,241,0.12)]" style={{ animationDelay: '30ms' }}>
          <div className="h-16 bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6]" />
          <div className="px-4 pb-5 pt-0 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="-mt-10 flex flex-col items-start gap-2">
                {hasVendorAvatar ? (
                  <img
                    src={vendorAvatar}
                    alt={vendorDisplayName}
                    className="cs-profile-avatar-bob cs-profile-image-thumb cs-profile-image-glow h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg shadow-indigo-200"
                  />
                ) : (
                  <div className="cs-profile-avatar-bob flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-indigo-100 to-blue-100 shadow-lg shadow-indigo-200">
                    <Building2 className="h-9 w-9 text-indigo-700" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={isUploadingPhoto}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading...' : (hasVendorAvatar ? 'Change Photo' : 'Upload Photo')}</span>
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelected}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <CircleDot className="h-3 w-3" /> Verified
                </span>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={startEditingProfile}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Pencil className="h-3 w-3" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`break-words text-2xl font-black tracking-tight sm:text-3xl ${organizationName ? 'text-slate-900' : 'italic text-slate-500'}`}>
                  {vendorDisplayName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3 fill-current" /> {averageRating} Rating
                </span>
              </div>

              <div className="mt-3 space-y-3 text-sm text-slate-500">

                {isEditingProfile ? (
                  <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <Building2 className="h-3.5 w-3.5" /> Company Name
                      </label>
                      <Input
                        value={draftValues.companyName}
                        onChange={(event) => setDraftValues((prev) => ({ ...prev, companyName: event.target.value }))}
                        placeholder="Add your company name"
                        className="h-9 bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </label>
                      <Input
                        value={draftValues.location}
                        onChange={(event) => setDraftValues((prev) => ({ ...prev, location: event.target.value }))}
                        placeholder="Add your location"
                        className="h-9 bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <FileText className="h-3.5 w-3.5" /> Description
                      </label>
                      <Textarea
                        value={draftValues.description}
                        onChange={(event) => setDraftValues((prev) => ({ ...prev, description: event.target.value }))}
                        rows={4}
                        placeholder="Add your company description"
                        className="bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-violet-500" />
                        {vendorEmail || <span className="italic text-slate-400">Add your email from settings</span>}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-indigo-500" />
                        <span className={organizationName ? 'text-slate-600' : 'italic text-slate-400'}>
                          {organizationName || 'Add your company name'}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-sky-500" />
                        <span className={vendorLocation ? 'text-slate-600' : 'italic text-slate-400'}>
                          {vendorLocation || 'Add your location'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <FileText className="mt-0.5 h-4 w-4 text-fuchsia-500" />
                      <p className={vendorDescription ? 'text-slate-600' : 'italic text-slate-400'}>
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
              <article key={item.label} className={`cs-profile-stat-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${statCardWrapTone(index)}`} style={{ animationDelay: `${100 + (index * 55)}ms` }}>
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

        <section className="cs-profile-section-reveal rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 shadow-[0_10px_24px_rgba(79,70,229,0.12)] sm:p-5" style={{ animationDelay: '110ms' }}>
          <h2 className="text-base font-semibold text-indigo-900">Upload Work Samples (Optional)</h2>
          <p className="mt-1 text-sm text-indigo-700/80">
            {isEditingProfile
              ? 'Upload documents or images to showcase your previous work quality.'
              : 'Uploaded work samples are shown below.'}
          </p>

          {isEditingProfile && sampleFiles.length === 0 && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-indigo-300/70 bg-white/80 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-800">Drag and drop files or choose from your device</p>
              <p className="mt-1 text-xs text-slate-500">Allowed: images, PDF, DOC, DOCX - max 10MB per file</p>
              <button
                type="button"
                onClick={openSamplesPicker}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Upload className="h-4 w-4" /> Upload Files
              </button>
              <input
                ref={samplesInputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleSamplesSelected}
              />
            </div>
          )}

          {imageSamples.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Image Samples</h3>
                {imagePageCount > 1 && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => setImagePage((prev) => Math.max(0, prev - 1))}
                      disabled={imagePage === 0}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:text-slate-300"
                      title="Previous images"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-slate-600">{imagePage + 1} / {imagePageCount}</span>
                    <button
                      type="button"
                      onClick={() => setImagePage((prev) => Math.min(imagePageCount - 1, prev + 1))}
                      disabled={imagePage >= imagePageCount - 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:text-slate-300"
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
                    className={`cs-profile-image-card overflow-hidden rounded-xl border-2 shadow-sm ${sampleFrameTone((imagePage * imagePageSize) + index)}`}
                    style={{ animationDelay: `${40 + (index * 55)}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => setViewerSampleId(item.id)}
                      className="group relative block w-full"
                    >
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="cs-profile-image-thumb h-36 w-full object-cover"
                      />
                      <span className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <Eye className="h-3.5 w-3.5" /> View
                      </span>
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t border-white/70 bg-white/85 px-2.5 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-800">{item.file.name}</p>
                        <p className="text-[11px] text-slate-500">{formatFileSize(item.file.size)}</p>
                      </div>
                      {isEditingProfile && (
                        <button
                          type="button"
                          onClick={() => requestDeleteSample(item.id)}
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
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Document Samples</h3>
              <div className="space-y-2">
                {documentSamples.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.file.name}</p>
                      <p className="text-xs text-slate-500">{getDocumentKindLabel(item.file)} • {formatFileSize(item.file.size)}</p>
                    </div>
                    <div className="ml-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => viewDocumentSample(item.id)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {isEditingProfile && (
                        <button
                          type="button"
                          onClick={() => requestDeleteSample(item.id)}
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

          {!isEditingProfile && sampleFiles.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No work samples uploaded yet.</p>
          )}
        </section>

        {isEditingProfile && (
          <section className="cs-profile-section-reveal flex flex-wrap items-center justify-end gap-2" style={{ animationDelay: '150ms' }}>
            <button
              type="button"
              onClick={cancelEditingProfile}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={saveEditingProfile}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-100 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
            >
              <Check className="h-4 w-4" /> Save
            </button>
          </section>
        )}

        <section className="cs-profile-section-reveal rounded-2xl border border-slate-200 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.06)]" style={{ animationDelay: '180ms' }}>
          <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-700">Recent Requests</h2>
          </div>

          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-500 sm:px-5">Loading recent requests...</div>
          )}

          {!isLoading && recentRequests.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500 sm:px-5">No recent requests yet.</div>
          )}

          {!isLoading && recentRequests.length > 0 && (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((request) => (
                <article key={String(request?.id || request?.title)} className="grid grid-cols-1 gap-1.5 px-4 py-2.5 transition-colors hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-cyan-50/40 sm:grid-cols-12 sm:items-center sm:px-5">
                  <div className="sm:col-span-7">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${request?.status === 'Completed' ? 'border border-violet-200 bg-violet-50 text-violet-700' : 'border border-sky-200 bg-sky-50 text-sky-700'}`}>
                      {request?.status || 'In Progress'}
                    </span>
                    <h3 className="mt-0.5 text-base font-medium tracking-tight text-slate-900 sm:text-lg">{request?.title || 'Request'}</h3>
                    <p className="text-xs text-slate-500 sm:text-sm">{request?.client || 'Client'} • {formatDate(request?.date)}</p>
                  </div>

                  <div className="text-left sm:col-span-2 sm:text-right">
                    <p className="text-lg font-medium text-slate-800 sm:text-xl">{formatMoney(request?.amount)}</p>
                  </div>

                  <div className="sm:col-span-3 sm:text-right">
                    {request?.status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-sm text-amber-700">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {Number(request?.rating || 0).toFixed(1)}
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

        <section className="cs-profile-section-reveal relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#5b5cf0] to-[#2f7de1] px-4 py-4 text-white shadow-[0_12px_24px_rgba(79,70,229,0.24)] sm:px-5 sm:py-4" style={{ animationDelay: '220ms' }}>
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs opacity-90">You have worked with</p>
              <p className="text-2xl font-black leading-none sm:text-3xl">
                {workedWithClients} Clients
              </p>
            </div>
            <span className="inline-flex w-full items-center justify-center rounded-xl bg-white/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur sm:w-auto">
              Vendor Profile
            </span>
          </div>
        </section>

        <Dialog
          open={Boolean(selectedImageSample)}
          onOpenChange={(open) => {
            if (!open) setViewerSampleId('');
          }}
        >
          <DialogContent className="max-w-3xl p-3 sm:p-4">
            <DialogHeader>
              <DialogTitle className="pr-8 text-base sm:text-lg">Image Preview</DialogTitle>
              <DialogDescription className="truncate pr-8">{selectedImageSample?.file?.name || ''}</DialogDescription>
            </DialogHeader>
            {selectedImageSample?.url && (
              <img
                src={selectedImageSample.url}
                alt={selectedImageSample.file.name}
                className="max-h-[72vh] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(pendingDeleteSampleId)}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteSampleId('');
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this sample?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteSample?.file?.name
                  ? `This will remove \"${pendingDeleteSample.file.name}\" from your uploaded work samples.`
                  : 'This will remove the selected file from your uploaded work samples.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSample}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
