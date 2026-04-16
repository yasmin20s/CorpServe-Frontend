import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Briefcase,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Wallet,
  X,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useAuth } from '../../hooks/useAuth';
import { getMyDetailedProfileApi, upsertUserProfileApi } from '../../services/userProfileApi';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { toast } from '../../lib/toast';
import { ProfilePhotoLightbox, getDisplayCompanyName } from '../../components/profile';
import { PROFILE_UPDATED_REALTIME_EVENT } from '../../context/SignalRContext';

const PROFILE_PIC_EVENT = 'corpserve:client-profile-picture-from-api';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

const tagTone = {
  design: 'border border-violet-200 bg-violet-50 text-violet-700',
  marketing: 'border border-pink-200 bg-pink-50 text-pink-700',
  legal: 'border border-amber-200 bg-amber-50 text-amber-700',
  'web dev': 'border border-sky-200 bg-sky-50 text-sky-700',
};

function statTone(label) {
  const key = String(label).toLowerCase();
  if (key.includes('completed')) return 'text-emerald-900 bg-emerald-200';
  if (key.includes('progress')) return 'text-blue-900 bg-blue-200';
  if (key.includes('budget')) return 'text-fuchsia-900 bg-fuchsia-200';
  return 'text-violet-900 bg-violet-200';
}

function statCardWrapTone(index) {
  const tones = [
    'from-violet-200 via-fuchsia-100 to-indigo-200 border-violet-300 shadow-violet-200/80',
    'from-emerald-200 via-teal-100 to-cyan-200 border-emerald-300 shadow-emerald-200/80',
    'from-sky-200 via-blue-100 to-indigo-200 border-sky-300 shadow-sky-200/80',
    'from-fuchsia-200 via-pink-100 to-rose-200 border-fuchsia-300 shadow-fuchsia-200/80',
  ];
  return tones[index % tones.length];
}

function statTextTone(index) {
  const tones = [
    { value: 'text-slate-900', label: 'text-violet-700' },
    { value: 'text-slate-900', label: 'text-emerald-700' },
    { value: 'text-slate-900', label: 'text-blue-700' },
    { value: 'text-slate-900', label: 'text-fuchsia-700' },
  ];
  return tones[index % tones.length];
}

function formatRequestDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeStatusLabel(rawStatus) {
  const raw = String(rawStatus ?? '').trim().toLowerCase();
  if (raw === '1' || raw === 'pending' || raw === 'open') return 'Open';
  if (raw === '2' || raw === 'active' || raw === 'in progress' || raw === 'inprogress') return 'In Progress';
  if (raw === '3' || raw === 'completed' || raw === 'done' || raw === 'closed') return 'Completed';
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Open';
}

function requestStatusTone(statusLabel) {
  const normalized = String(statusLabel).toLowerCase();
  if (normalized === 'completed') return 'border border-emerald-200 text-emerald-700 bg-emerald-100';
  if (normalized === 'in progress') return 'border border-blue-200 text-blue-700 bg-blue-100';
  return 'border border-purple-200 text-purple-700 bg-purple-100';
}

function categoryPillTone(index) {
  const tones = [
    'border-indigo-200 bg-indigo-50 text-indigo-700',
    'border-sky-200 bg-sky-50 text-sky-700',
    'border-violet-200 bg-violet-50 text-violet-700',
    'border-amber-200 bg-amber-50 text-amber-700',
    'border-slate-200 bg-slate-50 text-slate-700',
  ];
  return tones[index % tones.length];
}

function formatMoney(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 'EGP 0';
  return `EGP ${n.toLocaleString()}`;
}

function formatAvgBudget(avg) {
  const n = Number(avg);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (Math.abs(n) >= 1000) return `EGP ${(n / 1000).toFixed(1)}k`;
  return `EGP ${Math.round(n).toLocaleString()}`;
}

export default function UserProfileClient() {
  const navigate = useNavigate();
  const menuItems = useDashboardMenu('client');
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftValues, setDraftValues] = useState({
    company: '',
    location: '',
    bio: '',
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const raw = await getMyDetailedProfileApi(user.token);
      setDetails(raw && typeof raw === 'object' ? raw : null);
      setDraftValues({
        company: String(pick(raw, 'companyName', 'CompanyName') ?? ''),
        location: String(pick(raw, 'companyLocation', 'CompanyLocation') ?? ''),
        bio: String(pick(raw, 'description', 'Description') ?? ''),
      });
    } catch (e) {
      toast.error(e?.message || 'Failed to load profile');
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

  const fullName = String(pick(details, 'fullName', 'FullName') || user?.fullName || 'Client User').trim();
  const email = String(pick(details, 'email', 'Email') || user?.email || '');
  const pic = resolveMediaUrl(pick(details, 'profilePictureUrl', 'ProfilePictureUrl'));

  const syncHeaderAvatar = useCallback((url) => {
    const resolved = resolveMediaUrl(url);
    if (resolved) {
      window.dispatchEvent(new CustomEvent(PROFILE_PIC_EVENT, { detail: { url: resolved } }));
    }
  }, []);

  const startEditingProfile = () => {
    setDraftValues({
      company: String(pick(details, 'companyName', 'CompanyName') ?? ''),
      location: String(pick(details, 'companyLocation', 'CompanyLocation') ?? ''),
      bio: String(pick(details, 'description', 'Description') ?? ''),
    });
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
    setDraftValues({
      company: String(pick(details, 'companyName', 'CompanyName') ?? ''),
      location: String(pick(details, 'companyLocation', 'CompanyLocation') ?? ''),
      bio: String(pick(details, 'description', 'Description') ?? ''),
    });
  };

  const saveEditingProfile = async () => {
    if (!user?.token) return;
    try {
      await upsertUserProfileApi({
        companyName: draftValues.company,
        companyLocation: draftValues.location,
        description: draftValues.bio,
        token: user.token,
      });
      toast.success('Profile updated successfully.');
      setIsEditingProfile(false);
      await load();
    } catch (e) {
      toast.error(e?.message || 'Save failed');
    }
  };

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
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
      syncHeaderAvatar(pick(next, 'profilePictureUrl', 'ProfilePictureUrl'));
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const recentRequests = Array.isArray(pick(details, 'recentRequests', 'RecentRequests'))
    ? pick(details, 'recentRequests', 'RecentRequests')
    : [];
  const preferredCategories = Array.isArray(pick(details, 'preferredCategories', 'PreferredCategories'))
    ? pick(details, 'preferredCategories', 'PreferredCategories')
    : [];

  const t = Number(pick(details, 'totalRequestsCount', 'TotalRequestsCount') ?? 0);
  const c = Number(pick(details, 'completedRequestsCount', 'CompletedRequestsCount') ?? 0);
  const a = Number(pick(details, 'inProgressRequestsCount', 'InProgressRequestsCount') ?? 0);
  const avg = pick(details, 'averageBudget', 'AverageBudget');
  const partners = Number(pick(details, 'workingWithCount', 'WorkingWithCount') ?? 0);
  const userId = pick(details, 'userId', 'UserId');

  const companyText = getDisplayCompanyName(pick(details, 'companyName', 'CompanyName'), fullName);
  const locationText = String(pick(details, 'companyLocation', 'CompanyLocation') ?? '').trim();
  const bioText = String(pick(details, 'description', 'Description') ?? '').trim();
  const hasAvatar = Boolean(String(pic || '').trim());

  const stats = useMemo(
    () => [
      { label: 'Total Requests', value: t, icon: Briefcase },
      { label: 'Completed', value: c, icon: CheckCircle2 },
      { label: 'In Progress', value: a, icon: Clock },
      { label: 'Avg. Budget', value: `${formatAvgBudget(avg)}`, icon: Wallet },
    ],
    [t, c, a, avg],
  );

  if (loading && !details) {
    return (
      <DashboardLayout menuItems={menuItems} userRole="client">
        <div className="cs-profile-shell relative mx-auto flex min-h-[40vh] w-full max-w-6xl items-center justify-center overflow-x-hidden pb-8">
          <p className="text-center text-slate-600">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} userRole="client">
      <div className="cs-profile-shell relative mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden pb-8">
        <div className="cs-profile-orb-a pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="cs-profile-orb-b pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="cs-profile-orb-c pointer-events-none absolute bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-300/10 blur-3xl" />

        <section
          className="cs-profile-hero cs-profile-section-reveal overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_16px_34px_rgba(99,102,241,0.12)]"
          style={{ animationDelay: '30ms' }}
        >
          <div className="h-16 bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6]" />
          <div className="px-4 pb-5 pt-0 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col items-start gap-2">
                <div className="relative -mt-10 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-lg shadow-indigo-200">
                  <ProfilePhotoLightbox
                    src={pic}
                    wrapperClassName="h-full w-full"
                    imgClassName="cs-profile-image-thumb cs-profile-image-glow h-full w-full object-cover"
                    fallback={
                      <div className="cs-profile-avatar-bob flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100 text-center">
                        <span className="px-1 text-[10px] font-semibold leading-tight text-indigo-700">Upload your profile picture</span>
                      </div>
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={isUploadingPhoto}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
                  title="Upload new photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading...' : hasAvatar ? 'Change Photo' : 'Upload your profile picture'}</span>
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
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
                <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{fullName}</h1>
              </div>

              <div className="mt-3 space-y-3 text-sm text-slate-500">
                {isEditingProfile ? (
                  <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <Building2 className="h-3.5 w-3.5" /> Company Name
                      </label>
                      <Input
                        value={draftValues.company}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, company: e.target.value }))}
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
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Add your location"
                        className="h-9 bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <Briefcase className="h-3.5 w-3.5" /> Description
                      </label>
                      <Textarea
                        value={draftValues.bio}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        placeholder="Add your company description"
                        className="bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-indigo-500" />
                        {companyText ? companyText : <span className="italic text-slate-400">Add your company name</span>}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-sky-500" />
                        {locationText ? locationText : <span className="italic text-slate-400">Add your location</span>}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-violet-500" />
                        {email}
                      </span>
                    </div>

                    <div className="flex max-w-4xl items-start gap-1.5">
                      <p className={`${bioText ? 'text-slate-600' : 'italic text-slate-400'}`}>{bioText || 'Add your company description'}</p>
                    </div>
                  </>
                )}

                {isEditingProfile && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-violet-500" />
                    {email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {isEditingProfile && (
          <section className="cs-profile-section-reveal flex flex-wrap items-center justify-end gap-2" style={{ animationDelay: '60ms' }}>
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

        <section className="cs-profile-section-reveal grid grid-cols-2 gap-3 md:grid-cols-4" style={{ animationDelay: '70ms' }}>
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

        <section className="cs-profile-section-reveal rounded-2xl border border-slate-200 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.06)]" style={{ animationDelay: '120ms' }}>
          <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-700">Recent Requests</h2>
          </div>

          {recentRequests.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500 sm:px-5">No recent requests yet.</div>
          )}

          {recentRequests.length > 0 && (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((request) => {
                const requestId = pick(request, 'requestId', 'RequestId') ?? request?.id;
                const title = pick(request, 'requestTitle', 'RequestTitle') || `Request #${requestId ?? '-'}`;
                const date = formatRequestDate(pick(request, 'createdAt', 'CreatedAt'));
                const statusLabel = normalizeStatusLabel(
                  pick(request, 'requestStatusLabel', 'RequestStatusLabel', 'statusLabel', 'StatusLabel', 'requestStatus', 'RequestStatus', 'status', 'Status'),
                );
                const amount = formatMoney(pick(request, 'budgetMax', 'BudgetMax', 'budgetMin', 'BudgetMin'));
                const rawTag = String(pick(request, 'category', 'Category', 'categoryName', 'CategoryName') || 'General').trim();
                const shortTag = rawTag.toLowerCase().includes('web') ? 'Web Dev' : rawTag;
                const tone = tagTone[String(shortTag).toLowerCase()] || 'bg-slate-100 text-slate-700';

                return (
                  <article
                    key={String(requestId ?? title)}
                    className="grid grid-cols-1 gap-1.5 px-4 py-2.5 transition-colors hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-cyan-50/40 sm:grid-cols-12 sm:items-center sm:px-5"
                  >
                    <div className="sm:col-span-7">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{shortTag}</span>
                      <h3 className="mt-0.5 text-base font-medium tracking-tight text-slate-900 sm:text-lg">{title}</h3>
                      <p className="text-xs text-slate-400 sm:text-sm">{date}</p>
                    </div>

                    <div className="text-left sm:col-span-2 sm:text-right">
                      <p className="text-lg font-medium text-slate-800 sm:text-xl">{amount}</p>
                    </div>

                    <div className="sm:col-span-3 sm:text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm ${requestStatusTone(statusLabel)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="cs-profile-section-reveal rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/30 px-4 py-5 shadow-sm sm:px-6" style={{ animationDelay: '170ms' }}>
          <h2 className="mb-3 text-lg font-semibold text-slate-700">Preferred Categories</h2>
          {preferredCategories.length === 0 ? (
            <p className="text-sm text-slate-500">No preferred categories yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {preferredCategories.map((cat, index) => {
                const name = pick(cat, 'categoryName', 'CategoryName') || '—';
                const cnt = pick(cat, 'requestsCount', 'RequestsCount');
                return (
                  <span key={String(pick(cat, 'categoryId', 'CategoryId') || index)} className={`rounded-full border px-3 py-1 text-sm ${categoryPillTone(index)}`}>
                    {name}
                    {cnt != null && cnt !== '' ? ` (${cnt})` : ''}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="cs-profile-section-reveal relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#5b5cf0] to-[#2f7de1] px-4 py-4 text-white shadow-[0_12px_24px_rgba(79,70,229,0.24)] sm:px-5 sm:py-4"
          style={{ animationDelay: '220ms' }}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs opacity-90">Currently working with</p>
              <p className="text-2xl font-black leading-none sm:text-3xl">
                {partners} Vendor{partners === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (userId) navigate(`/client/user/${encodeURIComponent(String(userId))}`);
              }}
              className="w-full rounded-xl bg-white/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-white/40 sm:w-auto"
            >
              Active Partners
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
