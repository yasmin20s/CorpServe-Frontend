import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatRemainingDisplayForUi } from '../lib/activeRequestBadges';
import {
  UserRound,
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
  'On Track': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Warning: 'border-amber-200 bg-amber-50 text-amber-800',
  Delayed: 'border-red-200 bg-red-50 text-red-800',
  Blocked: 'border-rose-200 bg-rose-50 text-rose-800',
};

const taskBadgeClass = {
  'In Progress': 'border-violet-200 bg-violet-50 text-violet-800',
  Delayed: 'border-red-200 bg-red-50 text-red-800',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
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
  return map[key] || fallback || 'border-slate-200 bg-slate-50 text-slate-700';
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

  const taskState = (request.taskState && String(request.taskState).trim()) || 'In Progress';
  const slaLabel = (request.slaLabel && String(request.slaLabel).trim()) || 'On Track';
  const pct = Math.min(100, Math.max(0, Number(request.progressPercentage || 0)));
  const remainingText =
    request.remainingTimeDisplay?.trim()
    || (request.deadline ? formatRemainingDisplayForUi(request.deadline) : '-');
  const isOverdueRemaining = remainingText.toLowerCase().includes('overdue');

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{request.title}</h2>
            <p className="inline-flex items-center gap-2 text-sm text-slate-600">
              <UserRound className="h-4 w-4 shrink-0 text-violet-600" />
              <span>
                {counterpartyLabel}: <span className="font-medium text-slate-800">{counterpartyName}</span>
              </span>
            </p>
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Request description
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {request.description || '—'}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Task price</p>
            <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <Wallet className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              {formatPrice(request.price)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Deadline</p>
            <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <CalendarClock className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
              {formatDate(request.deadline)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Remaining</p>
            <p
              className={`inline-flex items-center gap-2 text-base text-slate-900 ${isOverdueRemaining ? 'font-bold text-red-800' : 'font-semibold'}`}
            >
              <Clock3 className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              {remainingText}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current progress</p>
            <p className="text-base font-semibold text-slate-900">{pct}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-violet-700">
              <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
              Latest work update
            </p>
            <span className="text-sm font-semibold text-slate-800">{pct}%</span>
          </div>
          {request.latestWorkUpdate ? (
            <p className="mb-3 text-sm leading-relaxed text-slate-600">{request.latestWorkUpdate}</p>
          ) : null}
          <Progress
            value={pct}
            className="h-2.5 bg-violet-100/80"
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
            className="gap-2 border-[#6f74ea] text-[#5f64da] hover:bg-violet-50"
            onClick={() => onViewSla(request.requestId)}
          >
            <FileText className="h-4 w-4" />
            View SLA
          </Button>
          {slaLabel === 'Warning' && (
            <Button
              type="button"
              className="gap-2 border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
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
              className="gap-2 border-[#6f74ea] text-[#5f64da] hover:bg-violet-50"
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
