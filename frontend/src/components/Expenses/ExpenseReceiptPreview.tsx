import { useState, type ReactElement } from "react";

import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { buildReceiptDownloadUrl, getReceiptKind, type ReceiptKind } from "@/lib/receipt.ts";

export interface ExpenseReceiptPreviewProps {
    readonly url: string;
    readonly title: string;
}

interface ReceiptViewerProps {
    readonly url: string;
    readonly kind: ReceiptKind;
    readonly label: string;
}

function ReceiptViewer({ url, kind, label }: ReceiptViewerProps): ReactElement {
    const [hasImageFailed, setHasImageFailed] = useState<boolean>(false);

    if (kind === "image" && !hasImageFailed) {
        return (
            <img
                src={url}
                alt={label}
                loading="lazy"
                onError={() => setHasImageFailed(true)}
                className="max-h-[70vh] w-full rounded-lg bg-group-paper object-contain"
            />
        );
    }

    if (kind === "pdf") {
        return <iframe src={url} title={label} className="h-[70vh] w-full rounded-lg bg-group-paper" />;
    }

    return (
        <p className="rounded-lg bg-group-paper px-3 py-6 text-center text-sm text-group-muted">
            No hay vista previa disponible para este archivo.
        </p>
    );
}

export function ExpenseReceiptPreview({ url, title }: ExpenseReceiptPreviewProps): ReactElement {
    const label = `Comprobante de ${title}`;
    const downloadUrl = buildReceiptDownloadUrl(url, label);

    return (
        <div className="space-y-3">
            <ReceiptViewer url={url} kind={getReceiptKind(url)} label={label} />
            <a
                href={downloadUrl}
                download
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
                <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" aria-hidden />
                Descargar comprobante
            </a>
        </div>
    );
}
