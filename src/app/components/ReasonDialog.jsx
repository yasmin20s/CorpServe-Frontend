import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

export default function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  confirmLabel = 'Confirm',
  confirmClassName = 'bg-red-600 text-white hover:bg-red-700',
  isLoading = false,
  onConfirm,
  trigger,
}) {
  const [reason, setReason] = useState('');

  const handleOpenChange = (isOpen) => {
    if (!isOpen) setReason('');
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="border border-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder || 'Enter a reason...'}
            className="min-h-28"
            maxLength={1000}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className={confirmClassName}
              onClick={handleConfirm}
              disabled={!reason.trim() || isLoading}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
