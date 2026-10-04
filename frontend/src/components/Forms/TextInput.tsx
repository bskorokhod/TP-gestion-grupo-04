import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import {cn} from "@/lib/cn.ts";

const baseInputClasses =
  "w-full rounded-xl border border-modal-border bg-modal-field px-4 text-sm text-modal-ink placeholder:text-modal-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-primary/30";

export function TextInput({
                            className,
                            ...props
                          }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(baseInputClasses, "h-12", className)}
      {...props}
    />
  );
}

export function TextArea({
                           className,
                           ...props
                         }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(baseInputClasses, "min-h-24 resize-none py-3", className)}
      {...props}
    />
  );
}