import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [suspendedMessage, setSuspendedMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const isSafeInternalRedirectPath = (path) => {
    if (!path || typeof path !== 'string') return false;
    if (!path.startsWith('/')) return false;
    if (path.startsWith('//')) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuspendedMessage('');
    const result = await login(formData);
    if (!result.success) {
      if (result.message?.toLowerCase().includes('suspended')) {
        setSuspendedMessage(result.message);
      }
      toast.error(result.message);
      return;
    }

    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    const safeRedirect = isSafeInternalRedirectPath(redirect) ? redirect : null;
    toast.success(result.message);
    navigate(safeRedirect || result.redirectTo);
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#f8fafc_48%,_#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_top,_#111827_0%,_#0b1220_50%,_#020617_100%)] lg:grid lg:h-dvh lg:grid-cols-[minmax(360px,0.95fr)_minmax(520px,1fr)] [@media(max-height:820px)]:lg:grid-cols-[minmax(320px,0.9fr)_minmax(500px,1fr)]">
      <section className="relative hidden h-dvh overflow-hidden lg:block">
        <img src="/login-meeting.jpg" alt="Team meeting" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(90,120,208,0.62)] via-[rgba(47,48,52,0.58)] to-[rgba(109,79,186,0.62)]" />
        <div className="absolute inset-0 bg-[rgba(24,32,70,0.22)]" />

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
            <div className="mb-5 sm:mb-6 [@media(max-height:820px)]:mb-3">
              <div className="text-center">
                <h2 className="flex items-center justify-center gap-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl [@media(max-height:820px)]:text-2xl">
                  Welcome Back
                  <ShieldCheck className="h-6 w-6 text-violet-500 dark:text-violet-300" />
                </h2>
                <p className="mt-1.5 text-base text-slate-500 dark:text-slate-300 sm:text-lg [@media(max-height:820px)]:text-sm">
                  Enter your credentials to access your account
                </p>
              </div>
            </div>

            {suspendedMessage && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold">Account Suspended</p>
                  <p className="mt-1">{suspendedMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 [@media(max-height:820px)]:space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-base">
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400 dark:focus:ring-violet-500/25 sm:text-base"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-base font-bold text-white shadow-lg shadow-violet-500/25 hover:from-blue-700 hover:to-violet-700 dark:shadow-violet-900/45"
                >
                  Sign In
                </Button>
              </div>

              <p className="text-sm text-center text-slate-600 dark:text-slate-300">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-violet-600 hover:underline dark:text-violet-300">
                  Sign up
                </Link>
              </p>
            </form>

            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              Use your registered account credentials to sign in.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

