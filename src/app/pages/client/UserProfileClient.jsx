import { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Building2, Camera, Check, CheckCircle2, CircleDot, Clock, Mail, MapPin, Pencil, Wallet, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useAuth } from '../../hooks/useAuth';
import { getMyRequestsApi } from '../../services/requestsApi';
import { toast } from '../../lib/toast';

const defaultProfile = {
    fullName: 'Client User',
    company: '',
    location: '',
    email: '',
    bio: '',
    avatar: '',
};

const LEGACY_DEFAULT_PROFILE = {
    company: 'NovaTech Solutions Inc.',
    location: 'San Francisco, CA',
    bio: 'Enterprise tech company focused on SaaS platforms and digital transformation. We partner with vendors across design, development, marketing, and legal to deliver great products.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?&w=160&h=160&q=80&auto=format&fit=crop',
};

const preferredCategories = ['Web Development', 'UI/UX Design', 'Digital Marketing', 'Legal & Compliance', 'Business Consulting'];
const PROFILE_STORAGE_PREFIX = 'corpserve-client-profile';
const PROFILE_AVATAR_UPDATED_EVENT = 'corpserve:client-profile-avatar-updated';

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
    if (!Number.isFinite(n) || n <= 0) return '$0';
    return `$${n.toLocaleString()}`;
}

export default function UserProfileClient() {
    const menuItems = useDashboardMenu('client');
    const { user } = useAuth();
    const userRole = String(user?.role || '').toLowerCase();
    const [recentRequests, setRecentRequests] = useState([]);
    const [isRecentLoading, setIsRecentLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [draftValues, setDraftValues] = useState({
        company: '',
        location: '',
        bio: '',
    });
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef(null);

    const profileStorageKey = useMemo(() => {
        const normalizedEmail = String(user?.email || 'guest').trim().toLowerCase();
        return `${PROFILE_STORAGE_PREFIX}:${normalizedEmail}`;
    }, [user?.email]);

    const baseProfile = useMemo(() => ({
        ...defaultProfile,
        fullName: user?.fullName?.trim() || defaultProfile.fullName,
        email: user?.email?.trim() || defaultProfile.email,
    }), [user?.email, user?.fullName]);

    const [profile, setProfile] = useState(baseProfile);

    useEffect(() => {
        let persistedProfile = {};
        try {
            const raw = localStorage.getItem(profileStorageKey);
            persistedProfile = raw ? (JSON.parse(raw) || {}) : {};
        } catch {
            persistedProfile = {};
        }

        setProfile({
            ...baseProfile,
            ...(persistedProfile && typeof persistedProfile === 'object' ? persistedProfile : {}),
            fullName: String(persistedProfile?.fullName || baseProfile.fullName).trim() || baseProfile.fullName,
            email: baseProfile.email,
            company: String(persistedProfile?.company || '').trim() === LEGACY_DEFAULT_PROFILE.company
                ? ''
                : String(persistedProfile?.company || '').trim(),
            location: String(persistedProfile?.location || '').trim() === LEGACY_DEFAULT_PROFILE.location
                ? ''
                : String(persistedProfile?.location || '').trim(),
            bio: String(persistedProfile?.bio || '').trim() === LEGACY_DEFAULT_PROFILE.bio
                ? ''
                : String(persistedProfile?.bio || '').trim(),
            avatar: String(persistedProfile?.avatar || '').trim() === LEGACY_DEFAULT_PROFILE.avatar
                ? ''
                : String(persistedProfile?.avatar || '').trim(),
        });
    }, [baseProfile, profileStorageKey]);

    useEffect(() => {
        const persistableProfile = {
            fullName: profile.fullName,
            company: profile.company,
            location: profile.location,
            bio: profile.bio,
            avatar: profile.avatar,
        };
        localStorage.setItem(profileStorageKey, JSON.stringify(persistableProfile));
    }, [profile, profileStorageKey]);

    const startEditingProfile = () => {
        setDraftValues({
            company: profile.company,
            location: profile.location,
            bio: profile.bio,
        });
        setIsEditingProfile(true);
    };

    const cancelEditingProfile = () => {
        setIsEditingProfile(false);
    };

    const saveEditingProfile = () => {
        setProfile((prev) => ({
            ...prev,
            company: String(draftValues.company || '').trim(),
            location: String(draftValues.location || '').trim(),
            bio: String(draftValues.bio || '').trim(),
        }));
        setIsEditingProfile(false);
        toast.success('Profile updated successfully.');
    };

    const openPhotoPicker = () => {
        photoInputRef.current?.click();
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

            setProfile((prev) => ({
                ...prev,
                avatar: imageData,
            }));
            const normalizedEmail = String(user?.email || '').trim().toLowerCase();
            window.dispatchEvent(new CustomEvent(PROFILE_AVATAR_UPDATED_EVENT, {
                detail: {
                    email: normalizedEmail,
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

    useEffect(() => {
        let mounted = true;

        const loadRecentRequests = async () => {
            if (!user?.token || userRole !== 'client') {
                if (mounted) {
                    setRecentRequests([]);
                    setIsRecentLoading(false);
                }
                return;
            }

            setIsRecentLoading(true);
            try {
                const response = await getMyRequestsApi({
                    token: user.token,
                    pageIndex: 1,
                    pageSize: 4,
                    sortDescending: true,
                });

                const list = Array.isArray(response?.data) ? response.data : [];
                if (mounted) setRecentRequests(list);
            } catch (error) {
                if (mounted) {
                    setRecentRequests([]);
                    toast.error(error?.message || 'Failed to load recent requests');
                }
            } finally {
                if (mounted) setIsRecentLoading(false);
            }
        };

        loadRecentRequests();
        return () => {
            mounted = false;
        };
    }, [user?.token, userRole]);

    const stats = useMemo(() => {
        const normalized = recentRequests.map((item) => normalizeStatusLabel(item?.requestStatusLabel ?? item?.statusLabel ?? item?.requestStatus ?? item?.status));
        const total = recentRequests.length;
        const completed = normalized.filter((s) => s === 'Completed').length;
        const inProgress = normalized.filter((s) => s === 'In Progress').length;
        const avgBudget = recentRequests.length
            ? Math.round(recentRequests.reduce((acc, item) => acc + Number(item?.budgetMax ?? item?.BudgetMax ?? item?.budgetMin ?? item?.BudgetMin ?? 0), 0) / recentRequests.length)
            : 0;

        return [
            { label: 'Total Requests', value: total || 84, icon: Briefcase },
            { label: 'Completed', value: completed || 71, icon: CheckCircle2 },
            { label: 'In Progress', value: inProgress || 9, icon: Clock },
            { label: 'Avg. Budget', value: avgBudget ? `$${(avgBudget / 1000).toFixed(1)}k` : '$4.6k', icon: Wallet },
        ];
    }, [recentRequests]);

    const companyText = String(profile.company || '').trim();
    const locationText = String(profile.location || '').trim();
    const bioText = String(profile.bio || '').trim();
    const hasAvatar = Boolean(String(profile.avatar || '').trim());

    return (
        <DashboardLayout menuItems={menuItems} userRole="client">
            <div className="cs-profile-shell relative mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden pb-8">
                <div className="cs-profile-orb-a pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl" />
                <div className="cs-profile-orb-b pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />
                <div className="cs-profile-orb-c pointer-events-none absolute bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-300/10 blur-3xl" />

                <section className="cs-profile-hero cs-profile-section-reveal overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_16px_34px_rgba(99,102,241,0.12)]" style={{ animationDelay: '30ms' }}>
                    <div className="h-16 bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6]" />
                    <div className="px-4 pb-5 pt-0 sm:px-6">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="flex flex-col items-start gap-2">
                                {hasAvatar ? (
                                    <img
                                        src={profile.avatar}
                                        alt={profile.fullName}
                                        className="cs-profile-avatar-bob cs-profile-image-thumb cs-profile-image-glow -mt-10 h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg shadow-indigo-200"
                                    />
                                ) : (
                                    <div className="cs-profile-avatar-bob -mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-indigo-100 to-blue-100 text-center shadow-lg shadow-indigo-200">
                                        <span className="px-1 text-[10px] font-semibold leading-tight text-indigo-700">Upload your profile picture</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={openPhotoPicker}
                                    disabled={isUploadingPhoto}
                                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
                                    title="Upload new photo"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    <span>{isUploadingPhoto ? 'Uploading...' : (hasAvatar ? 'Change Photo' : 'Upload your profile picture')}</span>
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
                                <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{profile.fullName}</h1>
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
                                                onChange={(event) => setDraftValues((prev) => ({ ...prev, company: event.target.value }))}
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
                                                <Briefcase className="h-3.5 w-3.5" /> Description
                                            </label>
                                            <Textarea
                                                value={draftValues.bio}
                                                onChange={(event) => setDraftValues((prev) => ({ ...prev, bio: event.target.value }))}
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
                                                {profile.email}
                                            </span>
                                        </div>

                                        <div className="flex max-w-4xl items-start gap-1.5">
                                            <p className={`${bioText ? 'text-slate-600' : 'italic text-slate-400'}`}>
                                                {bioText || 'Add your company description'}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {isEditingProfile && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Mail className="h-4 w-4 text-violet-500" />
                                        {profile.email}
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

                <section className="cs-profile-section-reveal rounded-2xl border border-slate-200 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.06)]" style={{ animationDelay: '120ms' }}>
                    <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
                        <h2 className="text-sm font-semibold text-slate-700">Recent Requests</h2>
                    </div>

                    {isRecentLoading && (
                        <div className="px-4 py-3 text-sm text-slate-500 sm:px-5">Loading recent requests...</div>
                    )}

                    {!isRecentLoading && recentRequests.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500 sm:px-5">No recent requests yet.</div>
                    )}

                    {!isRecentLoading && recentRequests.length > 0 && (
                            <div className="divide-y divide-slate-100">
                            {recentRequests.map((request) => {
                                const requestId = request?.requestId ?? request?.id;
                                const title = request?.title || `Request #${requestId ?? '-'}`;
                                const date = formatRequestDate(request?.createdAt || request?.CreatedAt);
                                const statusLabel = normalizeStatusLabel(request?.requestStatusLabel ?? request?.statusLabel ?? request?.requestStatus ?? request?.status);
                                const amount = formatMoney(request?.budgetMax ?? request?.BudgetMax ?? request?.budgetMin ?? request?.BudgetMin);
                                const rawTag = String(request?.categoryName ?? request?.CategoryName ?? 'General').trim();
                                const shortTag = rawTag.toLowerCase().includes('web') ? 'Web Dev' : rawTag;
                                const tone = tagTone[String(shortTag).toLowerCase()] || 'bg-slate-100 text-slate-700';

                                return (
                                    <article key={String(requestId ?? title)} className="grid grid-cols-1 gap-1.5 px-4 py-2.5 transition-colors hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-cyan-50/40 sm:grid-cols-12 sm:items-center sm:px-5">
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
                    <div className="flex flex-wrap gap-2.5">
                        {preferredCategories.map((category, index) => (
                            <span key={category} className={`rounded-full border px-3 py-1 text-sm ${categoryPillTone(index)}`}>
                                {category}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="cs-profile-section-reveal relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#5b5cf0] to-[#2f7de1] px-4 py-4 text-white shadow-[0_12px_24px_rgba(79,70,229,0.24)] sm:px-5 sm:py-4" style={{ animationDelay: '220ms' }}>
                    <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
                    <div className="pointer-events-none absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs opacity-90">Currently working with</p>
                            <p className="text-2xl font-black leading-none sm:text-3xl">12 Vendors</p>
                        </div>
                        <button type="button" className="w-full rounded-xl bg-white/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-white/40 sm:w-auto">
                            Active Partners
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}