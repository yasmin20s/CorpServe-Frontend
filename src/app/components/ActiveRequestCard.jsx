import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatRemainingDisplayForUi } from '../lib/activeRequestBadges';
import UserAvatar from './UserAvatar';
import {
  CalendarClock,
  Wallet,
  Clock3,
  Sparkles,
  FileText,
  MessageCircle,
  SquarePen,
  AlertTriangle,
} from 'lucide-react';

const slaBadgeClass = {
  'On Track': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/16 dark:text-emerald-200',
  Warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/35 dark:bg-amber-500/16 dark:text-amber-200',
  Delayed: 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/35 dark:bg-red-500/16 dark:text-red-200',
  Blocked: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/16 dark:text-rose-200',
};

const taskBadgeClass = {
  'In Progress': 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/16 dark:text-violet-200',
  Delayed: 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/35 dark:bg-red-500/16 dark:text-red-200',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/16 dark:text-emerald-200',
};

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB');
}

function formatPrice(value) {
  return `EGP ${Math.round(Number(value || 0)).toLocaleString()}`;
}

function badgeClass(map, key, fallback) {
  return map[key] || fallback || 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200';
}

/**
 * Active SLA task card — shared layout for client and vendor active-request lists.
 */
export default function ActiveRequestCard({
  request,
  role,
  onViewSla,
  onUpdateProgress,
  onChat,
}) {
  const isVendor = role === 'vendor';
  const counterpartyLabel = isVendor ? 'Client' : 'Vendor';
  const counterpartyName = isVendor
    ? (request.clientName || 'Client')
    : (request.vendorName || 'Assigned Vendor');
  const counterpartyId = isVendor ? request.clientId : request.vendorId;
  const counterpartyPic = isVendor ? request.clientProfilePictureUrl : request.vendorProfilePictureUrl;

  const taskState = (request.taskState && String(request.taskState).trim()) || 'In Progress';
  const slaLabel = (request.slaLabel && String(request.slaLabel).trim()) || 'On Track';
  const pct = Math.min(100, Math.max(0, Number(request.progressPercentage || 0)));
  const remainingText =
    request.remainingTimeDisplay?.trim()
    || (request.deadline ? formatRemainingDisplayForUi(request.deadline) : '-');
  const isOverdueRemaining = remainingText.toLowerCase().includes('overdue');

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/74 dark:shadow-[0_16px_34px_rgba(2,6,23,0.5)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{request.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="shrink-0 text-slate-500 dark:text-slate-400">{counterpartyLabel}:</span>
              <UserAvatar
                userId={counterpartyId}
                name={counterpartyName}
                profilePictureUrl={counterpartyPic}
                size="sm"
                linkClassName="max-w-[min(100%,280px)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Badge
              variant="outline"
              className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${badgeClass(taskBadgeClass, taskState)}`}
            >
              Task State: {taskState}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${badgeClass(slaBadgeClass, slaLabel)}`}
            >
              SLA: {slaLabel}
            </Badge>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Request description
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/68 dark:text-slate-300">
            {request.description || '—'}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/76">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Task price</p>
            <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Wallet className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              {formatPrice(request.price)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/76">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deadline</p>
            <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <CalendarClock className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
              {formatDate(request.deadline)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/76">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remaining</p>
            <p
              className={`inline-flex items-center gap-2 text-base text-slate-900 dark:text-slate-100 ${isOverdueRemaining ? 'font-bold text-red-800 dark:text-red-300' : 'font-semibold'}`}
            >
              <Clock3 className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              {remainingText}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/76">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current progress</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{pct}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-4 dark:border-violet-400/25 dark:bg-violet-500/12">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-200">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" aria-hidden />
              Latest work update
            </p>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pct}%</span>
          </div>
          {request.latestWorkUpdate ? (
            <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{request.latestWorkUpdate}</p>
          ) : null}
          <Progress
            value={pct}
            className="h-2.5 bg-violet-100/80 dark:bg-slate-700/70"
            indicatorClassName="bg-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          {typeof onUpdateProgress === 'function' && (
            <Button
              type="button"
              className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]"
              onClick={() => onUpdateProgress(request)}
            >
              <SquarePen className="h-4 w-4" />
              Update progress
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
              className="gap-2 border-[#6f74ea] text-[#5f64da] hover:bg-violet-50 dark:border-indigo-400/45 dark:text-indigo-200 dark:hover:bg-indigo-500/18"
            onClick={() => onViewSla(request.requestId)}
          >
            <FileText className="h-4 w-4" />
            View SLA
          </Button>
          {slaLabel === 'Warning' && (
            <Button
              type="button"
              className="gap-2 border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-400/45 dark:bg-amber-500/16 dark:text-amber-200 dark:hover:bg-amber-500/25"
              onClick={() => onViewSla(request.requestId)}
            >
              <AlertTriangle className="h-4 w-4" />
              Deadline is near
            </Button>
          )}
          {typeof onChat === 'function' && (
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-[#6f74ea] text-[#5f64da] hover:bg-violet-50 dark:border-indigo-400/45 dark:text-indigo-200 dark:hover:bg-indigo-500/18"
              onClick={() => onChat(request)}
            >
              <MessageCircle className="h-4 w-4" />
              {isVendor ? 'Chat with client' : 'Chat with vendor'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
