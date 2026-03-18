import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { ArrowLeft, Briefcase, Eye, EyeOff, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'sonner';
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
  };

  return (
    <div className="min-h-dvh bg-[#f4f5f8] lg:grid lg:h-dvh lg:grid-cols-[minmax(360px,0.95fr)_minmax(520px,1fr)] [@media(max-height:820px)]:lg:grid-cols-[minmax(320px,0.9fr)_minmax(500px,1fr)]">
      <section className="relative hidden h-dvh overflow-hidden lg:block">
        <img src="/team-hands.jpg" alt="People collaborating" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(80,43,247,0.5)] via-[rgba(26,27,31,0.58)] to-[rgba(109,79,186,0.62)]" />
        <div className="absolute inset-0 bg-[rgba(50,51,56,0.22)]" />

        <div className="absolute inset-x-0 top-0 p-6 xl:p-8 [@media(max-height:820px)]:p-4">
          <div className="flex items-center gap-4 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6f74ea] text-xl font-black text-white shadow-md shadow-blue-900/30">
              CS
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black xl:text-4xl [@media(max-height:820px)]:text-2xl">CorpServe</h1>
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

      <section className="flex min-h-dvh items-start justify-center px-4 py-4 sm:px-6 sm:py-5 lg:h-dvh lg:items-center lg:overflow-y-auto lg:px-10 lg:py-6 xl:px-12 [@media(max-height:820px)]:lg:px-8 [@media(max-height:820px)]:lg:py-4">
        <div className="w-full max-w-xl [@media(max-height:820px)]:max-w-lg">
          <div className="flex justify-end">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back to Home
            </Link>
          </div>

          <div className="mt-5 sm:mt-6 [@media(max-height:820px)]:mt-3">
            <div className="mb-5 sm:mb-6 [@media(max-height:830px)]:mb-10">
              <div className="text-center">
                <h2 className="flex items-center justify-center gap-2 text-4xl font-black tracking-tight text-slate-900 sm:text-4xl [@media(max-height:820px)]:text-2xl">
                  Create Account
                  <Sparkles className="h-6 w-6 text-violet-500" />
                </h2>
                <p className="mt-1.5 text-base text-slate-500 sm:text-lg [@media(max-height:820px)]:text-sm">Enter your details to get started.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 [@media(max-height:820px)]:space-y-3">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-slate-800 sm:text-base">
                    {formData.role === 'vendor' ? 'Company Name' : 'Full Name'}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={formData.role === 'vendor' ? 'Company Name' : 'John Doe'}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-800 sm:text-base">
                    {formData.role === 'vendor' ? 'Business Email' : 'Email Address'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={formData.role === 'vendor' ? 'business@email.com' : 'you@company.com'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-800 sm:text-base">
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
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm sm:text-base"
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-800 sm:text-base">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 rounded-xl border-slate-200 bg-white px-3.5 pr-11 text-sm sm:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-800 sm:text-base">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-11 rounded-xl border-slate-200 bg-white px-3.5 pr-11 text-sm sm:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {formData.role === 'vendor' && (
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-slate-800 sm:text-base">
                    Service Category <span className="text-violet-600">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 sm:text-base"
                    required={formData.role === 'vendor'}
                    disabled={loadingCategories}
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
                  {categoriesError && <p className="text-xs text-red-600">{categoriesError}</p>}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-800 sm:text-base">Account Type</Label>
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
                      formData.role === 'client' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                        <UserRound className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-900">Client</p>
                        <p className="text-xs text-slate-500 sm:text-sm">Looking for services</p>
                      </div>
                    </div>
                    <RadioGroupItem value="client" id="client" />
                  </Label>

                  <Label
                    htmlFor="vendor"
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                      formData.role === 'vendor' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                        <Briefcase className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-900">Vendor</p>
                        <p className="text-xs text-slate-500 sm:text-sm">Providing services</p>
                      </div>
                    </div>
                    <RadioGroupItem value="vendor" id="vendor" />
                  </Label>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-base font-bold shadow-lg shadow-violet-500/25 hover:from-blue-700 hover:to-violet-700"
              >
                Create Account
              </Button>

              <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600 sm:text-base">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">
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
