import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

/**
 * Image preview shell shared with {@link ProfilePhotoLightbox}: title, light panel, rounded image, object-contain.
 * Visible filename is omitted; `imageAlt` is for accessibility only (sr-only + img alt).
 */
export default function ImagePreviewDialog({ open, onOpenChange, imageSrc, imageAlt = '' }) {
  const alt = String(imageAlt || '').trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92dvh] max-w-3xl flex-col gap-0 overflow-hidden p-3 sm:p-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 pb-3 text-left">
          <DialogTitle className="pr-8 text-base sm:text-lg">Image Preview</DialogTitle>
          <DialogDescription className="sr-only">{alt || 'Image preview'}</DialogDescription>
        </DialogHeader>
        {imageSrc ? (
          <div className="flex min-h-[12rem] flex-1 items-center justify-center overflow-auto">
            <img
              src={imageSrc}
              alt={alt}
              className="h-auto max-h-[min(72vh,calc(92dvh-9rem))] w-auto max-w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
