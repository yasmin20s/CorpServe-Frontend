import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function AnalyticsRangeDialog({
  open,
  onOpenChange,
  initialStartDateUtc,
  initialEndDateUtc,
  onApply,
  isSubmitting = false,
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStartDate(toInputDate(initialStartDateUtc));
    setEndDate(toInputDate(initialEndDateUtc));
    setError('');
  }, [open, initialStartDateUtc, initialEndDateUtc]);

  const isValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  const handleApply = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    setError('');
    await onApply?.({ startDateUtc: startDate, endDateUtc: endDate });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Date Range</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="analytics-start-date">Start Date</Label>
            <Input
              id="analytics-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="analytics-end-date">End Date</Label>
            <Input
              id="analytics-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          {error ? <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Applying...' : 'Apply Range'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
