import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Star,
  Users,
  Wallet,
  CircleDot,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { getUserProfileByIdApi } from '../../services/userProfileApi';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { toast } from '../../lib/toast';
import { PROFILE_UPDATED_REALTIME_EVENT } from '../../context/SignalRContext';
import {
  ImagePreviewDialog,
  ProfilePhotoLightbox,
  formatMoneyFull,
  getAccountStatusClasses,
  getAccountStatusLabel,
  getDisplayCompanyName,
} from '../../components/profile';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function isImageDocType(documentType) {
  const t = String(documentType || '').toLowerCase();
  return t.startsWith('image/');
}

function isImageDocument(documentType, fileName) {
  if (isImageDocType(documentType)) return true;
  const n = String(fileName || '').toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(n);
}

/** Client-style stat chips (matches UserProfileClient) */
function statToneClient(label) {
  const key = String(label).toLowerCase();
  if (key.includes('completed')) return 'text-violet-900 bg-violet-200 dark:text-violet-100 dark:bg-violet-500/30';
  if (key.includes('progress')) return 'text-blue-900 bg-blue-200 dark:text-blue-100 dark:bg-blue-500/30';
  return 'text-fuchsia-900 bg-fuchsia-200 dark:text-fuchsia-100 dark:bg-fuchsia-500/30';
}

function statCardWrapToneClient(index) {
  const tones = [
    'from-violet-200 via-fuchsia-100 to-indigo-200 border-violet-300 shadow-violet-200/80 dark:from-blue-500/24 dark:via-violet-500/18 dark:to-pink-500/18 dark:border-blue-400/35 dark:shadow-none',
    'from-pink-200 via-fuchsia-100 to-violet-200 border-pink-300 shadow-pink-200/80 dark:from-indigo-500/24 dark:via-fuchsia-500/18 dark:to-pink-500/20 dark:border-indigo-400/35 dark:shadow-none',
    'from-indigo-200 via-violet-100 to-fuchsia-200 border-indigo-300 shadow-indigo-200/80 dark:from-blue-500/26 dark:via-indigo-500/18 dark:to-violet-500/18 dark:border-blue-400/35 dark:shadow-none',
  ];
  return tones[index % tones.length];
}

function statTextToneClient(index) {
  const tones = [
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-blue-700 dark:text-blue-200' },
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-fuchsia-700 dark:text-fuchsia-200' },
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-indigo-700 dark:text-indigo-200' },
  ];
  return tones[index % tones.length];
}

/** Vendor-style stat chips (matches UserProfileVendor) */
function statToneVendor(label) {
  const key = String(label).toLowerCase();
  if (key.includes('clients')) return 'text-blue-900 bg-blue-200 dark:text-blue-100 dark:bg-blue-500/30';
  if (key.includes('completed')) return 'text-fuchsia-900 bg-fuchsia-200 dark:text-fuchsia-100 dark:bg-fuchsia-500/30';
  return 'text-pink-900 bg-pink-200 dark:text-pink-100 dark:bg-pink-500/30';
}

function statCardWrapToneVendor(index) {
  const tones = [
    'from-violet-200 via-fuchsia-100 to-indigo-200 border-violet-300 shadow-violet-200/80 dark:from-blue-500/24 dark:via-violet-500/18 dark:to-pink-500/18 dark:border-blue-400/35 dark:shadow-none',
    'from-pink-200 via-fuchsia-100 to-violet-200 border-pink-300 shadow-pink-200/80 dark:from-indigo-500/24 dark:via-fuchsia-500/18 dark:to-pink-500/20 dark:border-indigo-400/35 dark:shadow-none',
    'from-indigo-200 via-violet-100 to-fuchsia-200 border-indigo-300 shadow-indigo-200/80 dark:from-blue-500/26 dark:via-indigo-500/18 dark:to-violet-500/18 dark:border-blue-400/35 dark:shadow-none',
  ];
  return tones[index % tones.length];
}

function statTextToneVendor(index) {
  const tones = [
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-blue-700 dark:text-blue-200' },
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-fuchsia-700 dark:text-fuchsia-200' },
    { value: 'text-slate-900 dark:text-slate-100', label: 'text-pink-700 dark:text-pink-200' },
  ];
  return tones[index % tones.length];
}

function categoryPillTone(index) {
  const tones = [
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/35 dark:bg-indigo-500/16 dark:text-indigo-200',
    'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/35 dark:bg-fuchsia-500/16 dark:text-fuchsia-200',
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/35 dark:bg-violet-500/16 dark:text-violet-200',
    'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-400/35 dark:bg-pink-500/16 dark:text-pink-200',
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/45 dark:bg-slate-700/45 dark:text-slate-200',
  ];
  return tones[index % tones.length];
}

function sampleFrameTone(index) {
  const tones = [
    'border-violet-300 bg-violet-50/35 dark:border-violet-400/35 dark:bg-violet-500/10',
    'border-fuchsia-300 bg-fuchsia-50/35 dark:border-fuchsia-400/35 dark:bg-fuchsia-500/10',
    'border-pink-300 bg-pink-50/35 dark:border-pink-400/35 dark:bg-pink-500/10',
    'border-indigo-300 bg-indigo-50/35 dark:border-indigo-400/35 dark:bg-indigo-500/10',
  ];
  return tones[index % tones.length];
}

function getDocumentKindLabel(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'PDF';
  if (name.endsWith('.docx')) return 'DOCX';
  if (name.endsWith('.doc')) return 'DOC';
  return 'Document';
}

function openDocumentUrl(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function PublicUserProfile() {
  const { userId } = useParams();
  const { user, isBootstrapping } = useAuth();
  const token = user?.token;
  const viewerRole = String(user?.role || 'client').toLowerCase();
  const menuItems = useDashboardMenu(viewerRole);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDocumentImage, setPreviewDocumentImage] = useState(null);

  const load = useCallback(async ({ showSpinner = true, showErrorToast = true } = {}) => {
    if (!token || !userId) {
      setLoading(false);
      return;
    }
    if (showSpinner) setLoading(true);
    try {
      const raw = await getUserProfileByIdApi({ userId, token });
      setData(raw && typeof raw === 'object' ? raw : null);
    } catch (e) {
      setData(null);
      if (showErrorToast) {
        toast.error(e?.message || 'Failed to load profile');
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onProfileUpdated = () => load();
    window.addEventListener(PROFILE_UPDATED_REALTIME_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_REALTIME_EVENT, onProfileUpdated);
  }, [load]);

  // Keep public profile near real-time for other viewers even if they don't receive direct profile notifications.
  useEffect(() => {
    if (!token || !userId) return undefined;

    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return;
      load({ showSpinner: false, showErrorToast: false });
    };

    const interval = window.setInterval(refreshIfVisible, 8000);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [load, token, userId]);

  const p = useMemo(() => {
    if (!data) return null;
    const fullNameRaw = pick(data, 'fullName', 'FullName') || 'User';
    return {
      userId: pick(data, 'userId', 'UserId'),
      fullName: fullNameRaw,
      email: pick(data, 'email', 'Email') || '',
      role: String(pick(data, 'role', 'Role') || '').toLowerCase(),
      accountStatus: pick(data, 'accountStatus', 'AccountStatus') || '',
      isOwner: Boolean(pick(data, 'isOwner', 'IsOwner')),
      companyName: getDisplayCompanyName(pick(data, 'companyName', 'CompanyName'), fullNameRaw),
      companyLocation: pick(data, 'companyLocation', 'CompanyLocation') || '',
      profilePictureUrl: pick(data, 'profilePictureUrl', 'ProfilePictureUrl') || '',
      description: pick(data, 'description', 'Description') || '',
      vendorStars: pick(data, 'vendorStars', 'VendorStars'),
      ratingCount: pick(data, 'ratingCount', 'RatingCount'),
      totalEarnings: pick(data, 'totalEarnings', 'TotalEarnings'),
      isVendorVerified: Boolean(pick(data, 'isVendorVerified', 'IsVendorVerified')),
      totalRequestsCount: Number(pick(data, 'totalRequestsCount', 'TotalRequestsCount') ?? 0),
      completedRequestsCount: Number(pick(data, 'completedRequestsCount', 'CompletedRequestsCount') ?? 0),
      inProgressRequestsCount: Number(pick(data, 'inProgressRequestsCount', 'InProgressRequestsCount') ?? 0),
      workingWithCount: Number(pick(data, 'workingWithCount', 'WorkingWithCount') ?? 0),
      preferredCategories: Array.isArray(pick(data, 'preferredCategories', 'PreferredCategories'))
        ? pick(data, 'preferredCategories', 'PreferredCategories')
        : [],
      servedCategories: Array.isArray(pick(data, 'servedCategories', 'ServedCategories'))
        ? pick(data, 'servedCategories', 'ServedCategories')
        : [],
      documents: Array.isArray(pick(data, 'documents', 'Documents')) ? pick(data, 'documents', 'Documents') : [],
    };
  }, [data]);

  const isVendor = p?.role === 'vendor';
  const isClient = p?.role === 'client';

  const imageDocs = useMemo(() => {
    return (p?.documents || []).filter((d) => {
      const name = String(pick(d, 'name', 'Name') || '');
      return isImageDocument(pick(d, 'documentType', 'DocumentType'), name);
    });
  }, [p?.documents]);

  const fileDocs = useMemo(() => {
    return (p?.documents || []).filter((d) => {
      const name = String(pick(d, 'name', 'Name') || '');
      return !isImageDocument(pick(d, 'documentType', 'DocumentType'), name);
    });
  }, [p?.documents]);

  const clientStats = useMemo(() => {
    if (!p || !isClient) return [];
    return [
      { label: 'Total Requests', value: p.totalRequestsCount, icon: Briefcase },
      { label: 'Completed', value: p.completedRequestsCount, icon: CheckCircle2 },
      { label: 'In Progress', value: p.inProgressRequestsCount, icon: Clock },
    ];
  }, [p, isClient]);

  const vendorStats = useMemo(() => {
    if (!p || !isVendor) return [];
    const showEarnings = p.isOwner && p.totalEarnings != null;
    return [
      { label: 'Worked With Clients', value: p.workingWithCount, icon: Users },
      { label: 'Completed Requests', value: p.completedRequestsCount, icon: CheckCircle2 },
      showEarnings
        ? { label: 'Total Earnings', value: formatMoneyFull(p.totalEarnings), icon: Wallet }
        : { label: 'Total Requests', value: p.totalRequestsCount, icon: Briefcase },
    ];
  }, [p, isVendor]);

  const averageRating = useMemo(() => {
    if (!p || !isVendor) return '0.0';
    const n = Number(p.vendorStars);
    if (p.vendorStars != null && p.vendorStars !== '' && Number.isFinite(n)) return n.toFixed(1);
    return '0.0';
  }, [p, isVendor]);

  const ratingCountDisplay =
    p != null && isVendor && p.ratingCount != null && p.ratingCount !== '' && Number.isFinite(Number(p.ratingCount))
      ? Number(p.ratingCount)
      : null;

  if (isBootstrapping || loading) {
    return (
      <DashboardLayout menuItems={menuItems} userRole={viewerRole}>
        <div className="cs-profile-shell relative mx-auto flex min-h-[40vh] w-full max-w-6xl items-center justify-center overflow-x-hidden pb-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-300" />
          <span className="ml-2 text-slate-600 dark:text-slate-300">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!p) {
    return (
      <DashboardLayout menuItems={menuItems} userRole={viewerRole}>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">Profile not found.</div>
      </DashboardLayout>
    );
  }

  const resolvedProfilePhoto = resolveMediaUrl(p.profilePictureUrl);
  const servedCategoryNames = (p.servedCategories || []).filter(Boolean);
  const accountStatusLabel = getAccountStatusLabel(p.accountStatus);
  const accountStatusClasses = getAccountStatusClasses(p.accountStatus);

  const companyText = p.companyName || '';
  const locationText = String(p.companyLocation || '').trim();

  return (
    <DashboardLayout menuItems={menuItems} userRole={viewerRole}>
      <div className="cs-profile-shell relative mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden pb-8">
        <div className="cs-profile-orb-a pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-500/12" />
        <div className="cs-profile-orb-b pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl dark:bg-blue-500/12" />
        <div className="cs-profile-orb-c pointer-events-none absolute bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-300/10 blur-3xl dark:bg-indigo-500/10" />

        <section
          className="cs-profile-hero cs-profile-section-reveal overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_12px_24px_rgba(99,102,241,0.1)] dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-[#0f1b3d] dark:via-[#2b1f61] dark:to-[#5a2b6f] dark:shadow-[0_14px_30px_rgba(2,6,23,0.46)]"
          style={{ animationDelay: '30ms' }}
        >
          <div className="h-16 bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6] dark:from-[#1e3a8a] dark:via-[#6d28d9] dark:to-[#ec4899]" />
          <div className="px-4 pb-5 pt-0 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="-mt-10 flex flex-col items-start gap-2">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-[0_8px_18px_rgba(79,70,229,0.16)] dark:border-slate-900 dark:shadow-[0_10px_20px_rgba(2,6,23,0.44)]">
                  <ProfilePhotoLightbox
                    src={resolvedProfilePhoto}
                    wrapperClassName="cs-profile-avatar-bob h-full w-full"
                    imgClassName="cs-profile-image-thumb cs-profile-image-glow h-full w-full object-cover"
                    fallback={
                      <div className="cs-profile-avatar-bob flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100 shadow-[0_8px_18px_rgba(79,70,229,0.16)] dark:from-indigo-500/24 dark:to-blue-500/20 dark:shadow-[0_10px_20px_rgba(2,6,23,0.44)]">
                        <Building2 className="h-9 w-9 text-indigo-700 dark:text-indigo-200" />
                      </div>
                    }
                  />
                </div>
              </div>
              <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                {isVendor ? (
                  <>
                    {p.isVendorVerified ? (
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
                    {p.isVendorVerified && servedCategoryNames.length > 0
                      ? servedCategoryNames.map((name, i) => (
                          <span
                            key={`${name}-${i}`}
                            className="max-w-[min(100%,14rem)] truncate rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/16 dark:text-violet-200"
                            title={name}
                          >
                            {name}
                          </span>
                        ))
                      : null}
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/16 dark:text-emerald-200">
                      <CircleDot className="h-3 w-3" /> Verified
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${accountStatusClasses}`}>
                      <CircleDot className="h-3 w-3" /> Account: {accountStatusLabel}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{p.fullName}</h1>
                {isVendor ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/16 dark:text-amber-200">
                    <Star className="h-3 w-3 fill-current" /> {averageRating} Rating
                    {ratingCountDisplay != null && ratingCountDisplay > 0 ? (
                      <span className="font-normal text-amber-800/90 dark:text-amber-200/80">({ratingCountDisplay})</span>
                    ) : null}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-3 text-sm text-slate-500 dark:text-slate-300">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-pink-500 dark:text-pink-300" />
                    {p.email || <span className="italic text-slate-400 dark:text-slate-500">—</span>}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                    {companyText ? (
                      <span className="text-slate-600 dark:text-slate-300">{companyText}</span>
                    ) : (
                      <span className="italic text-slate-400 dark:text-slate-500">No company name</span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-fuchsia-500 dark:text-fuchsia-300" />
                    {locationText ? (
                      <span className="text-slate-600 dark:text-slate-300">{locationText}</span>
                    ) : (
                      <span className="italic text-slate-400 dark:text-slate-500">No location</span>
                    )}
                  </span>
                </div>
                <div className="flex max-w-4xl items-start gap-1.5">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-pink-500 dark:text-pink-300" />
                  <p className={p.description ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}>
                    {p.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isClient && clientStats.length > 0 ? (
          <section className="cs-profile-section-reveal grid grid-cols-2 gap-3 md:grid-cols-3" style={{ animationDelay: '70ms' }}>
            {clientStats.map((item, index) => {
              const Icon = item.icon;
              const textTone = statTextToneClient(index);
              return (
                <article
                  key={item.label}
                  className={`cs-profile-stat-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${statCardWrapToneClient(index)}`}
                  style={{ animationDelay: `${100 + index * 55}ms` }}
                >
                  <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/24 blur-xl dark:bg-slate-100/8" />
                  <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white/55 dark:ring-slate-200/15 ${statToneClient(item.label)}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className={`text-[28px] font-black leading-none ${textTone.value}`}>{item.value}</p>
                  <p className={`mt-2 text-sm font-semibold ${textTone.label}`}>{item.label}</p>
                </article>
              );
            })}
          </section>
        ) : null}

        {isVendor && vendorStats.length > 0 ? (
          <section className="cs-profile-section-reveal grid grid-cols-2 gap-3 md:grid-cols-3" style={{ animationDelay: '70ms' }}>
            {vendorStats.map((item, index) => {
              const Icon = item.icon;
              const textTone = statTextToneVendor(index);
              return (
                <article
                  key={item.label}
                  className={`cs-profile-stat-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${statCardWrapToneVendor(index)}`}
                  style={{ animationDelay: `${100 + index * 55}ms` }}
                >
                  <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/24 blur-xl dark:bg-slate-100/8" />
                  <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white/55 dark:ring-slate-200/15 ${statToneVendor(item.label)}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className={`text-[28px] font-black leading-none ${textTone.value}`}>{item.value}</p>
                  <p className={`mt-2 text-sm font-semibold ${textTone.label}`}>{item.label}</p>
                </article>
              );
            })}
          </section>
        ) : null}

        {(isClient || isVendor) && (p.documents || []).length > 0 ? (
          <section
            className="cs-profile-section-reveal rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 shadow-[0_10px_24px_rgba(79,70,229,0.12)] dark:border-indigo-400/30 dark:bg-gradient-to-br dark:from-[#0f1b3d] dark:via-[#2b1f61] dark:to-[#5a2b6f] dark:shadow-none sm:p-5"
            style={{ animationDelay: '110ms' }}
          >
            <div>
              <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">Work samples</h2>
              <p className="mt-1 text-sm text-indigo-700/80 dark:text-indigo-200/80">Uploaded work samples are shown below.</p>
            </div>

            {imageDocs.length > 0 ? (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Image Samples</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {imageDocs.map((d, index) => {
                    const url = resolveMediaUrl(pick(d, 'documentUrl', 'DocumentUrl'));
                    const name = String(pick(d, 'name', 'Name') || `Image ${index + 1}`);
                    if (!url) return null;
                    return (
                      <article
                        key={`${url}-${index}`}
                        className={`cs-profile-image-card overflow-hidden rounded-xl border-2 shadow-sm ${sampleFrameTone(index)}`}
                        style={{ animationDelay: `${40 + index * 55}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewDocumentImage({ url, name })}
                          className="group relative block w-full"
                        >
                          <img
                            src={url}
                            alt={name}
                            className="cs-profile-image-thumb h-36 w-full bg-slate-100 object-contain dark:bg-slate-950/60"
                            loading="lazy"
                          />
                          <span className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            <Eye className="h-3.5 w-3.5" /> View
                          </span>
                        </button>
                        <div className="flex items-center justify-between gap-2 border-t border-white/70 bg-white/85 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/85">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">{name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Portfolio file</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {fileDocs.length > 0 ? (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Document Samples</h3>
                <div className="space-y-2">
                  {fileDocs.map((d, i) => {
                    const url = resolveMediaUrl(pick(d, 'documentUrl', 'DocumentUrl'));
                    const name = String(pick(d, 'name', 'Name') || `Document ${i + 1}`);
                    const dt = pick(d, 'documentType', 'DocumentType');
                    const kind =
                      dt && !isImageDocType(dt)
                        ? String(dt).split('/').pop()
                        : getDocumentKindLabel({ name });
                    return (
                      <div
                        key={`${url}-${i}`}
                        className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white px-3 py-2 dark:border-indigo-400/30 dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {kind}
                            {' • '}
                            Portfolio file
                          </p>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDocumentUrl(url)}
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-400/35 dark:bg-indigo-500/16 dark:text-indigo-200 dark:hover:bg-indigo-500/24"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {isClient && (p.preferredCategories || []).length > 0 ? (
          <section
            className="cs-profile-section-reveal rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/30 px-4 py-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-indigo-500/10 dark:to-pink-500/10 sm:px-6"
            style={{ animationDelay: '170ms' }}
          >
            <h2 className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-200">Preferred Categories</h2>
            <div className="flex flex-wrap gap-2.5">
              {(p.preferredCategories || []).map((cat, index) => {
                const name = pick(cat, 'categoryName', 'CategoryName') || '—';
                const cnt = pick(cat, 'requestsCount', 'RequestsCount');
                return (
                  <span
                    key={String(pick(cat, 'categoryId', 'CategoryId') || index)}
                    className={`rounded-full border px-3 py-1 text-sm ${categoryPillTone(index)}`}
                  >
                    {name}
                    {cnt != null && cnt !== '' ? ` (${cnt})` : ''}
                  </span>
                );
              })}
            </div>
          </section>
        ) : null}

        <section
          className="cs-profile-section-reveal relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#5b5cf0] to-[#2f7de1] px-4 py-4 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] dark:from-[#1e3a8a] dark:via-[#6d28d9] dark:to-[#ec4899] dark:shadow-[0_12px_24px_rgba(2,6,23,0.45)] sm:px-5 sm:py-4"
          style={{ animationDelay: '220ms' }}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isVendor ? (
              <>
                <div>
                  <p className="text-xs opacity-90">Clients served</p>
                  <p className="text-2xl font-black leading-none sm:text-3xl">
                    {p.workingWithCount} Client{p.workingWithCount === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="inline-flex w-full items-center justify-center rounded-xl bg-white/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur sm:w-auto">
                  Public profile
                </span>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs opacity-90">Currently working with</p>
                  <p className="text-2xl font-black leading-none sm:text-3xl">
                    {p.workingWithCount} Vendor{p.workingWithCount === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="inline-flex w-full items-center justify-center rounded-xl bg-white/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur sm:w-auto">
                  Public profile
                </span>
              </>
            )}
          </div>
        </section>

        <ImagePreviewDialog
          open={Boolean(previewDocumentImage)}
          onOpenChange={(next) => {
            if (!next) setPreviewDocumentImage(null);
          }}
          imageSrc={previewDocumentImage?.url || ''}
          imageAlt={previewDocumentImage?.name || ''}
        />
      </div>
    </DashboardLayout>
  );
}
