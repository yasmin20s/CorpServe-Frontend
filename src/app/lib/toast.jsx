import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Info,
  TriangleAlert,
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

const VARIANT_CONFIG = {
  success: {
    title: 'Success',
    icon: CheckCircle2,
    iconClass: 'bg-violet-600 text-white',
    progressClass: 'from-violet-500 to-blue-500',
    detailClass: 'border-violet-100 bg-indigo-50/80 text-indigo-800',
    dismissClass: 'text-indigo-700 hover:bg-indigo-50',
  },
  error: {
    title: 'Error',
    icon: AlertCircle,
    iconClass: 'bg-rose-600 text-white',
    progressClass: 'from-rose-500 to-orange-500',
    detailClass: 'border-rose-100 bg-rose-50/80 text-rose-800',
    dismissClass: 'text-rose-700 hover:bg-rose-50',
  },
  warning: {
    title: 'Warning',
    icon: TriangleAlert,
    iconClass: 'bg-amber-500 text-white',
    progressClass: 'from-amber-400 to-orange-500',
    detailClass: 'border-amber-100 bg-amber-50/80 text-amber-800',
    dismissClass: 'text-amber-700 hover:bg-amber-50',
  },
  info: {
    title: 'Information',
    icon: Info,
    iconClass: 'bg-blue-600 text-white',
    progressClass: 'from-blue-500 to-indigo-500',
    detailClass: 'border-blue-100 bg-blue-50/80 text-blue-800',
    dismissClass: 'text-blue-700 hover:bg-blue-50',
  },
};

function ExpandableToast({ variant, title, message, details, durationMs, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMs);

  useEffect(() => {
    const tickMs = 100;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - tickMs));
    }, tickMs);

    return () => window.clearInterval(timer);
  }, []);

  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.info;
  const Icon = config.icon ?? Bell;
  const progress = Math.max(0, (timeLeft / durationMs) * 100);
  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div className="w-[360px] overflow-hidden rounded-2xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur-md">
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 rounded-xl p-2 ${config.iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{title || config.title}</p>
              <p className="mt-0.5 text-sm text-gray-600">{message}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Expand notification"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>
          </div>

          <div
            className={`grid transition-all duration-300 ease-out ${expanded ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className={`rounded-xl border p-3 text-sm ${config.detailClass}`}>
                {details || 'Notification details are available.'}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Closing in {secondsLeft}s</span>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${config.dismissClass}`}
            >
              Dismiss
            </button>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${config.progressClass} transition-[width] duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function showToast(variant, message, options = {}) {
  const durationMs = options.duration ?? 6500;

  return sonnerToast.custom(
    (toastRef) => (
      <ExpandableToast
        variant={variant}
        title={options.title}
        message={message}
        details={options.details}
        durationMs={durationMs}
        onClose={() => sonnerToast.dismiss(toastRef.id)}
      />
    ),
    { duration: durationMs }
  );
}

export const toast = {
  success: (message, options) => showToast('success', message, options),
  error: (message, options) => showToast('error', message, options),
  warning: (message, options) => showToast('warning', message, options),
  info: (message, options) => showToast('info', message, options),
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};
