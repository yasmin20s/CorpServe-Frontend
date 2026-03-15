import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

function isStrongPassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUpper && hasLower && hasNumber;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, validateResetToken } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token') || '';
  const tokenState = useMemo(() => validateResetToken(token), [token, validateResetToken]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tokenState.valid) {
      toast.error(tokenState.message || 'Invalid reset link');
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error('Password must be at least 8 characters with upper, lower, and number');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = resetPassword({ token, password });

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success('Password reset successfully. Please log in.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[#e9edf2]">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#060d2a] via-[#151a57] to-[#23204f] pb-8 pt-4 sm:pb-10 sm:pt-5 lg:pb-8">
        <div className="absolute -left-14 top-28 h-12 w-12 rounded-full border border-blue-300/35 bg-blue-400/15 shadow-[0_0_24px_rgba(87,94,255,0.32)]" />
        <div className="absolute right-8 top-20 h-8 w-8 rounded-full border border-blue-300/25 bg-blue-400/10" />
        <div className="absolute right-10 top-8 rotate-12 rounded-2xl border border-violet-300/20 bg-white/10 p-2.5 backdrop-blur">
          <ShieldCheck className="h-4.5 w-4.5 text-violet-200" />
        </div>

        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgb(95,111,232)] text-base font-black text-white shadow-md shadow-violet-500/35">
              CS
            </div>
            <h1 className="text-lg font-black tracking-tight sm:text-xl">CorpServe</h1>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3.5 sm:py-1.5"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Login
          </Link>
        </div>

        <div className="mx-auto mt-4 max-w-[560px] px-4 text-center sm:mt-6 sm:px-6">
          <div className="mb-2.5 flex items-center justify-center gap-2 sm:mb-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/25 bg-white/10 text-violet-100 backdrop-blur sm:h-9 sm:w-9">
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300/25 bg-blue-400/10 text-blue-100 backdrop-blur sm:h-9 sm:w-9">
              <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/25 bg-white/10 text-violet-100 backdrop-blur sm:h-9 sm:w-9">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <h2 className="text-[1.65rem] font-black tracking-tight text-white sm:text-[2rem]">Set New Password</h2>
          <p className="mx-auto mt-2 max-w-[460px] text-xs leading-relaxed text-slate-300 sm:text-sm">
            Your new password must be unique to those previously used to ensure maximum security.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-[450px] px-4 pb-8 sm:mt-10 sm:px-6">
        <div className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-[0_14px_36px_rgba(24,33,74,0.14)] sm:p-4.5">
          <div className="-mt-8 mb-3.5 flex justify-center sm:-mt-10 sm:mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-violet-100 bg-slate-100 shadow-[0_8px_18px_rgba(90,79,241,0.16)] sm:h-14 sm:w-14">
              <LockKeyhole className="h-6 w-6 text-violet-500 sm:h-7 sm:w-7" />
            </div>
          </div>

          {!tokenState.valid ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 sm:text-sm">
                {tokenState.message || 'Invalid reset link'}
              </div>
              <Link to="/forgot-password" className="block">
                <Button className="h-10 w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold hover:from-blue-700 hover:to-violet-700">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-base font-black text-slate-700 sm:text-lg">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-700 placeholder:text-slate-400 sm:h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-base font-black text-slate-700 sm:text-lg">
                  Confirm Password
                </Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-700 placeholder:text-slate-400 sm:h-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-black shadow-[0_10px_20px_rgba(88,79,241,0.28)] hover:from-blue-700 hover:to-violet-700 sm:h-11 sm:text-base"
              >
                Reset Password
              </Button>
            </form>
          )}

          <div className="mt-4 border-t border-slate-200 pt-3.5 text-center text-xs text-slate-500">
            Remember your password?{' '}
            <Link to="/login" className="font-black text-violet-600 transition hover:text-violet-700">
              Log in securely
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
