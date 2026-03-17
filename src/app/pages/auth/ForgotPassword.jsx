import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await requestPasswordReset(email);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setSubmitted(true);
  };

  return (
    <div className="min-h-dvh bg-[#f4f5f8] px-4 py-4 sm:px-6 sm:py-5 lg:flex lg:h-dvh lg:flex-col lg:justify-center lg:overflow-y-auto lg:px-8 lg:py-4 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1140px] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(95,111,232)] text-lg font-black text-white shadow-md shadow-violet-500/30 sm:h-11 sm:w-11 sm:text-xl">
            CS
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-2xl">CorpServe</h1>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back to Login
        </Link>
      </div>

      <div className="mx-auto mt-4 w-full max-w-[1140px] rounded-[1.6rem] bg-white p-2.5 shadow-[0_24px_70px_rgba(14,20,50,0.08)] lg:mt-3 lg:p-4">
        <div className="grid gap-4 lg:h-full lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#08112f] via-[#101843] to-[#131f55] p-5 sm:p-6 lg:min-h-[470px] lg:p-7">
            <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
            <div className="absolute -bottom-24 right-[-72px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur sm:h-14 sm:w-14">
                <ShieldCheck className="h-6 w-6 text-violet-300 sm:h-7 sm:w-7" />
              </div>

              <h2 className="text-2xl font-black leading-[1.12] tracking-tight text-white sm:text-3xl lg:text-4xl">
                Secure Password
                <br />
                <span className="text-violet-400">Recovery</span>
              </h2>

              <p className="mt-4 max-w-[430px] text-sm leading-relaxed text-slate-300 sm:text-base lg:text-lg">
                We use industry-standard encryption to ensure your account details remain private during the
                recovery process.
              </p>

              <div className="mt-auto flex items-center gap-4 pt-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-300/20 bg-blue-500/10 sm:h-12 sm:w-12">
                  <KeyRound className="h-5 w-5 text-blue-200" />
                </div>
                <div className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-blue-300/25 to-transparent" />
                <Lock className="h-5 w-5 text-slate-300/80" />
              </div>
            </div>
          </section>

          <section className="relative flex flex-col rounded-[1.35rem] bg-white px-4 py-5 sm:px-6 sm:py-6 lg:h-full lg:px-7 lg:py-7">
            <div className="absolute right-5 top-6 text-violet-100 sm:right-8 sm:top-8">
              <KeyRound className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-extrabold tracking-wide text-violet-600 sm:px-4 sm:py-2 sm:text-sm">
              <KeyRound className="h-4 w-4" />
              ACCOUNT ACCESS
            </span>

            <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-2xl">Forgot Password?</h3>
            <p className="mt-2.5 max-w-[620px] text-sm leading-relaxed text-slate-500 sm:text-base">
              Enter the email address associated with your account and we&apos;ll send you a secure link to reset it.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 sm:text-base">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., alex@company.com"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-violet-300 sm:h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-white shadow-[0_12px_28px_rgba(89,79,235,0.35)] hover:from-blue-700 hover:to-violet-700 sm:h-12 sm:text-base"
                >
                  Send Reset Instructions
                </Button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900">
                  We&apos;ve sent a password reset link to <span className="font-semibold">{email}</span>. Please check
                  your inbox and follow the instructions.
                </div>
                <Link to="/login" className="block">
                  <Button
                    type="button"
                    className="h-10 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-shadow-indigo-500 over:from-blue-700 hover:to-violet-700 sm:h-11"
                  >
                    Back to Login
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-auto border-t border-slate-200 pt-6 text-xs text-slate-500 sm:text-sm">
              Remembered it?{' '}
              <Link to="/login" className="font-bold text-slate-800 transition hover:text-violet-600">
                Log in here
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
