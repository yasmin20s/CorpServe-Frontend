import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { ArrowLeft, Briefcase, Eye, EyeOff, Loader2, Sparkles, UserRound } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getCategoriesApi } from '../../services/categoriesApi';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    categoryId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError('');
    try {
      const data = await getCategoriesApi();
      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.value)
            ? data.value
            : [];
      setCategories(normalized);
      if (normalized.length === 0) {
        setCategoriesError('No categories found. Please contact admin to create categories first.');
      }
    } catch (error) {
      const message = error.message || 'Failed to load categories';
      setCategoriesError(message);
      toast.error(message);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.role === 'vendor' && categories.length === 0 && !loadingCategories) {
      loadCategories();
    }
  }, [formData.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Phone validation: starts with 01, max 11 digits
    const phoneRegex = /^01\d{0,9}$/;
    if (!phoneRegex.test(formData.phone) || formData.phone.length > 11) {
      toast.error('Phone number must start with 01 and be at most 11 digits');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.role === 'vendor' && !formData.categoryId) {
      toast.error('Please select a service category');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role === 'vendor' ? 'Vendor' : 'Client',
        categoryIds: formData.role === 'vendor' ? [formData.categoryId] : [],
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      navigate(result.redirectTo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#f8fafc_48%,_#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_top,_#111827_0%,_#0b1220_50%,_#020617_100%)] lg:grid lg:h-dvh lg:grid-cols-[minmax(360px,0.95fr)_minmax(520px,1fr)] [@media(max-height:820px)]:lg:grid-cols-[minmax(320px,0.9fr)_minmax(500px,1fr)]">
      <section className="relative hidden h-dvh overflow-hidden lg:block">
        <img src="/team-hands.jpg" alt="People collaborating" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(80,43,247,0.5)] via-[rgba(26,27,31,0.58)] to-[rgba(109,79,186,0.62)]" />
        <div className="absolute inset-0 bg-[rgba(50,51,56,0.22)]" />

        <div className="absolute inset-x-0 top-0 p-6 xl:p-8 [@media(max-height:820px)]:p-4">
          <div className="flex items-center gap-4 text-white">
            <div className="cs-brand-badge flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white ring-1 ring-white/30">
              CS
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl [@media(max-height:820px)]:text-2xl">CorpServe</h1>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 flex items-center p-6 text-white xl:p-8 [@media(max-height:820px)]:p-4">
          <div className="flex max-w-lg flex-col">
          <h2 className="max-w-lg text-4xl font-black leading-[1.06] tracking-tight xl:text-5xl [@media(max-height:820px)]:text-3xl">
            Transform your
            <br />
            <span className="text-blue-300">service</span>
            <br />
            <span className="text-white">management</span>
          </h2>
          <p className="mt-4 max-w-xl text-2xl leading-relaxed text-slate-100/95 xl:text-xl [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:text-base">
            Join thousands of businesses streamlining operations, connecting with top-tier vendors, and scaling
            with CorpServe&apos;s intelligent platform.
          </p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 hidden p-6 text-xs text-slate-200 xl:block xl:p-8 xl:text-sm [@media(max-height:820px)]:hidden">
          <div className="flex items-center gap-4">
            <span>© 2026 CorpServe Inc.</span>
            <span>•</span>
            <span>Privacy</span>
            <span>•</span>
            <span>Terms</span>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-dvh items-start justify-center px-4 py-4 sm:px-6 sm:py-5 lg:h-dvh lg:items-center lg:overflow-y-auto lg:px-10 lg:py-6 xl:px-12 [@media(max-height:820px)]:lg:px-8 [@media(max-height:820px)]:lg:py-4">
        <div className="pointer-events-none absolute left-8 top-14 h-44 w-44 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/20" />
        <div className="pointer-events-none absolute bottom-16 right-12 h-52 w-52 rounded-full bg-blue-300/25 blur-3xl dark:bg-indigo-500/20" />

        <div className="w-full max-w-xl p-0 dark:rounded-3xl dark:border dark:border-slate-700/70 dark:bg-slate-900/82 dark:p-5 dark:shadow-[0_26px_70px_rgba(2,6,23,0.62)] dark:backdrop-blur-xl sm:dark:p-6 [@media(max-height:820px)]:max-w-lg">
          <div className="flex justify-end">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-100/85 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 dark:border-violet-300/25 dark:bg-violet-500/15 dark:text-violet-100 dark:hover:bg-violet-500/25 sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back to Home
            </Link>
          </div>

          <div className="mt-5 sm:mt-6 [@media(max-height:820px)]:mt-3">
            <div className="mb-5 sm:mb-6 [@media(max-height:830px)]:mb-10">
              <div className="text-center">
                <h2 className="flex items-center justify-center gap-2 text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl [@media(max-height:820px)]:text-2xl">
                  Create Account
                  <Sparkles className="h-6 w-6 text-violet-500 dark:text-violet-300" />
                </h2>
                <p className="mt-1.5 text-base text-slate-500 dark:text-slate-300 sm:text-lg [@media(max-height:820px)]:text-sm">Enter your details to get started.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 [@media(max-height:820px)]:space-y-3">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    {'Full Name'}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={'Your Full Name'}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    {formData.role === 'vendor' ? 'Business Email' : 'Email Address'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={formData.role === 'vendor' ? 'business@email.com' : 'you@company.com'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, phone: value });
                    }}
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                    maxLength={11}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 rounded-xl border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-11 rounded-xl border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {formData.role === 'vendor' && (
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    Service Category <span className="text-violet-600">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 dark:[color-scheme:dark] sm:text-base"
                    required={formData.role === 'vendor'}
                    disabled={loadingCategories || isSubmitting}
                  >
                    <option value="">
                      {loadingCategories
                        ? 'Loading categories...'
                        : categories.length === 0
                          ? 'No categories available'
                          : 'Select your service category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoriesError && <p className="text-xs text-red-600 dark:text-red-300">{categoriesError}</p>}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">Account Type</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value, categoryId: value === 'vendor' ? formData.categoryId : '' })
                  }
                  className="grid grid-cols-1 gap-8 sm:grid-cols-2"
                >
                  <Label
                    htmlFor="client"
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                      formData.role === 'client'
                        ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-500/15'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/72 dark:hover:bg-slate-800/72'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-[0_8px_18px_rgba(124,58,237,0.35)]">
                        <UserRound className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Client</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 sm:text-sm">Looking for services</p>
                      </div>
                    </div>
                    <RadioGroupItem value="client" id="client" className="border-slate-400 text-violet-600 dark:border-slate-500 dark:text-violet-300" />
                  </Label>

                  <Label
                    htmlFor="vendor"
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                      formData.role === 'vendor'
                        ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-500/15'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/72 dark:hover:bg-slate-800/72'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-[0_8px_18px_rgba(124,58,237,0.35)]">
                        <Briefcase className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Vendor</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 sm:text-sm">Providing services</p>
                      </div>
                    </div>
                    <RadioGroupItem value="vendor" id="vendor" className="border-slate-400 text-violet-600 dark:border-slate-500 dark:text-violet-300" />
                  </Label>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-base font-bold text-white shadow-lg shadow-violet-500/25 hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-violet-900/45"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:text-base">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

