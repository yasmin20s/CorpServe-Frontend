"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "./utils";
const Dialog = ({ ...props }) => <DialogPrimitive.Root data-slot="dialog" {...props} />;
const DialogTrigger = ({ ...props }) => <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
const DialogPortal = ({ ...props }) => <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
const DialogClose = ({ ...props }) => <DialogPrimitive.Close data-slot="dialog-close" {...props} />;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
        <DialogPrimitive.Overlay
            ref={ref}
            data-slot="dialog-overlay"
            className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]", className)}
            {...props}
        />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />
            <DialogPrimitive.Content
                ref={ref}
                data-slot="dialog-content"
                className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid max-h-[92dvh] w-full max-w-[calc(100%-1rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-violet-200/80 bg-gradient-to-br from-white/96 via-violet-50/75 to-blue-50/80 p-4 shadow-[0_24px_80px_-35px_rgba(76,29,149,0.55)] backdrop-blur-md duration-200 sm:max-w-lg sm:rounded-2xl sm:p-6", className)}
                {...props}
            >
                {children}
                <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md border border-violet-200/70 bg-white/75 p-1.5 text-slate-500 opacity-90 transition-colors hover:bg-violet-100/70 hover:text-violet-700 focus:ring-2 focus:ring-violet-400/60 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                    <XIcon />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;
function DialogHeader({ className, ...props }) {
    return (<div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props}/>);
}
function DialogFooter({ className, ...props }) {
    return (<div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}/>);
}
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} data-slot="dialog-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, };
