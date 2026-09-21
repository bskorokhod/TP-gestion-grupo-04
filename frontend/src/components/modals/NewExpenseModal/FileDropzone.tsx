import {useRef, useState, type DragEvent} from "react";

import {cn} from "@/lib/cn.ts";

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileDropzone({
                               file,
                               onFileChange,
                             }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed bg-modal-field px-4 py-6 text-center transition-colors",
        isDragOver
          ? "border-modal-primary bg-modal-soft"
          : "border-modal-border",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={(event) =>
          onFileChange(event.target.files?.[0] ?? null)
        }
      />

      {file ? (
        <div className="flex min-w-0 flex-col items-center gap-2">
          <p className="max-w-full truncate text-sm font-medium text-modal-ink">
            {file.name}
          </p>

          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-xs font-medium text-modal-primary underline-offset-2 hover:underline"
          >
            Quitar archivo
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-modal-ink">
            Arrastrá el ticket o factura
          </p>

          <p className="text-xs text-modal-muted">
            PDF o imagen, hasta 10 MB
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 rounded-full border border-modal-border bg-modal-surface px-4 py-2 text-sm font-medium text-modal-primary transition-colors hover:bg-modal-field"
          >
            Elegir archivo
          </button>
        </>
      )}
    </div>
  );
}