import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

import { toast } from "@/hooks/useToast.ts";
import { cn } from "@/lib/cn.ts";

export interface CopyChipProps {
    readonly value: string;
    readonly label: string;
    readonly successTitle: string;
    readonly errorTitle: string;
    readonly className?: string;
    readonly valueClassName?: string;
}

export function CopyChip({value, label, successTitle, errorTitle, className, valueClassName}: CopyChipProps) {
    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(value);
            toast({title: successTitle});
        } catch {
            toast({
                variant: "destructive",
                title: errorTitle,
                description: `Copialo manualmente: ${value}`,
            });
        }
    }

    return (
        <div
            className={cn("inline-flex max-w-full items-center gap-1 rounded-full py-1 pl-5 pr-1 shadow-none", className)}>
            <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copiar ${label} ${value} al portapapeles`}
                title="Copiar al portapapeles"
                className={cn(
                    "min-w-0 cursor-pointer truncate text-lg font-bold tracking-widest tabular-nums text-modal-ink transition-colors hover:text-modal-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md",
                    valueClassName,
                )}
            >
                {value}
            </button>
            <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copiar ${label} al portapapeles`}
                title="Copiar al portapapeles"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-modal-primary transition-colors hover:bg-modal-field focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                <FontAwesomeIcon icon={faCopy} className="h-4 w-4" aria-hidden/>
            </button>
        </div>
    );
}
