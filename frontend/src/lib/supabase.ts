import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hosxzydkpstptmwjnhzh.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc3h6eWRrcHN0cHRtd2puaHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTM4NzUsImV4cCI6MjA3Nzg2OTg3NX0.Kjkyq6zv-bw5bPKFNXORtgbAi6OPOqDQaFoyKTMFwgg";

export const AVATAR_BUCKET = "profile-pictures";
export const EXPENSE_RECEIPTS_BUCKET = "expense-receipts";
export const DEBT_RECEIPTS_BUCKET = "debt-receipts";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function fileExtension(file: File): string {
    if (!file.name.includes(".")) return "bin";
    const extension = file.name.split(".").pop();
    return extension && extension.length > 0 ? extension : "bin";
}

async function uploadAt(bucket: string, path: string, file: File): Promise<string> {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type });

    if (error) {
        throw new Error(`No se pudo subir el archivo: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

export function uploadExpenseReceipt(file: File): Promise<string> {
    return uploadAt(
        EXPENSE_RECEIPTS_BUCKET,
        `${crypto.randomUUID()}.${fileExtension(file)}`,
        file,
    );
}

/** Se particiona por grupo para poder aplicar policies por carpeta si hace falta. */
export function uploadDebtReceipt(file: File, groupId: number): Promise<string> {
    return uploadAt(
        DEBT_RECEIPTS_BUCKET,
        `${groupId}/${crypto.randomUUID()}.${fileExtension(file)}`,
        file,
    );
}

export function uploadAvatar(file: File, userId: number | string): Promise<string> {
    return uploadAt(
        AVATAR_BUCKET,
        `${userId}/${crypto.randomUUID()}.${fileExtension(file)}`,
        file,
    );
}