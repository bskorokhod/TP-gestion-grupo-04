import { supabase, DEBT_RECEIPTS_BUCKET } from "@/lib/supabase";

/**
 * Sube un comprobante de pago de deuda al bucket configurado y devuelve su URL pública.
 * La carpeta se particiona por grupo para poder aplicar policies por carpeta si hace falta.
 */
export async function uploadDebtReceipt(file: File, groupId: number): Promise<string> {
    const extension = file.name.includes(".") ? file.name.split(".").pop()! : "bin";
    const path = `${groupId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from(DEBT_RECEIPTS_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
        throw new Error(`No se pudo subir el comprobante: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(DEBT_RECEIPTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}