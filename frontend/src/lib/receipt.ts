export type ReceiptKind = "image" | "pdf" | "unknown";

const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"]);
const PDF_EXTENSION = "pdf";
const FALLBACK_EXTENSION = "bin";
const DEFAULT_DOWNLOAD_NAME = "comprobante";
const DOWNLOAD_QUERY_PARAM = "download";
const FORBIDDEN_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function extensionOf(url: string): string | null {
    try {
        const match = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname);
        return match ? match[1].toLowerCase() : null;
    } catch {
        return null;
    }
}

export function getReceiptKind(url: string): ReceiptKind {
    const extension = extensionOf(url);
    if (extension === PDF_EXTENSION) return "pdf";
    if (extension !== null && IMAGE_EXTENSIONS.has(extension)) return "image";
    return "unknown";
}

function sanitizeFileName(name: string): string {
    const cleaned = name.replace(FORBIDDEN_FILE_NAME_CHARACTERS, "").trim();
    return cleaned.length > 0 ? cleaned : DEFAULT_DOWNLOAD_NAME;
}

/**
 * El atributo `download` de un <a> se ignora cuando la URL es de otro origen (el comprobante vive
 * en Supabase), así que el navegador abriría el archivo en vez de bajarlo. Supabase responde con
 * `Content-Disposition: attachment` cuando la URL pública lleva `?download=<nombre>`.
 */
export function buildReceiptDownloadUrl(url: string, baseName: string): string {
    try {
        const downloadUrl = new URL(url);
        const extension = extensionOf(url) ?? FALLBACK_EXTENSION;
        downloadUrl.searchParams.set(DOWNLOAD_QUERY_PARAM, `${sanitizeFileName(baseName)}.${extension}`);
        return downloadUrl.toString();
    } catch {
        return url;
    }
}
