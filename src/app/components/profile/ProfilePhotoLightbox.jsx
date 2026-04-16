import { useState } from 'react';

import { Eye } from 'lucide-react';

import ImagePreviewDialog from './ImagePreviewDialog';



/**

 * Profile / avatar image: hover affordance + same preview dialog as document image samples.

 * @param {{ src?: string; fallback: import('react').ReactNode; wrapperClassName?: string; imgClassName?: string }} props

 */

export default function ProfilePhotoLightbox({

  src,

  fallback,

  wrapperClassName = '',

  imgClassName = '',

}) {

  const [open, setOpen] = useState(false);



  if (!src) {

    return fallback;

  }



  return (

    <>

      <button

        type="button"

        className={`group relative inline-flex cursor-zoom-in overflow-hidden rounded-[inherit] border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${wrapperClassName}`}

        onClick={() => setOpen(true)}

        aria-label="View profile photo full size"

      >

        <img src={src} alt="" className={imgClassName} loading="lazy" />

        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/30">

          <span className="flex scale-95 items-center gap-1.5 rounded-full border border-white/80 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 group-hover:scale-100">

            <Eye className="h-3.5 w-3.5" />

            View

          </span>

        </span>

      </button>



      <ImagePreviewDialog open={open} onOpenChange={setOpen} imageSrc={src} imageAlt="Profile photo" />

    </>

  );

}


