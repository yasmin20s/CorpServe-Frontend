import { useState } from 'react';
import { format, isValid, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';
import { parseDdMmYyyy } from '../lib/formatDeadlineDate';

/**
 * Calendar popover (single day) with dd/MM/yyyy display, Today, Cancel, and Apply — matches app deadline UX.
 */
export default function DeadlineCalendarPicker({
  id,
  value,
  onChange,
  disabled,
  className,
  triggerClassName,
  placeholder = 'dd/mm/yyyy',
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(undefined);
  const [calendarKey, setCalendarKey] = useState(0);

  const handleOpenChange = (next) => {
    if (next) {
      const parsed = parseDdMmYyyy(value);
      setDraft(parsed ?? undefined);
      setCalendarKey((k) => k + 1);
    }
    setOpen(next);
  };

  const handleApply = () => {
    if (draft && isValid(draft)) {
      onChange(format(draft, 'dd/MM/yyyy'));
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleToday = () => {
    setDraft(startOfDay(new Date()));
  };

  const displayDraft = draft && isValid(draft) ? format(draft, 'dd/MM/yyyy') : '';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex !h-auto w-full min-w-0 items-center justify-between gap-2 whitespace-nowrap rounded-xl border-none bg-[#f1f3f7] px-3 py-6 text-left text-sm font-normal leading-normal outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-[#6366f1]/35 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950/65',
            !value && 'text-gray-500 dark:text-slate-400',
            value && 'text-gray-700 dark:text-slate-100',
            triggerClassName,
            className,
          )}
        >
          <span className="min-w-0 truncate tabular-nums">{value || placeholder}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-400" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        sideOffset={8}
      >
        <div className="flex flex-col">
          <Calendar
            key={calendarKey}
            mode="single"
            weekStartsOn={1}
            selected={draft}
            onSelect={setDraft}
            initialFocus
            defaultMonth={draft ?? new Date()}
            classNames={{
              day_selected:
                'bg-[#6366f1] text-white hover:bg-[#5558e6] hover:text-white focus:bg-[#6366f1] focus:text-white',
              day_today: 'bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100',
            }}
            className="p-3 dark:text-slate-100"
          />
          <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-3 dark:border-slate-700">
            <Input
              readOnly
              tabIndex={-1}
              value={displayDraft}
              placeholder={placeholder}
              className="h-10 flex-1 rounded-lg border-slate-200 bg-slate-50 tabular-nums dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={handleToday}>
              Today
            </Button>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-3 py-3 dark:border-slate-700">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="bg-[#6366f1] text-white hover:bg-[#5558e6]" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
