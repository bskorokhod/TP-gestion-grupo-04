import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hosxzydkpstptmwjnhzh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc3h6eWRrcHN0cHRtd2puaHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTM4NzUsImV4cCI6MjA3Nzg2OTg3NX0.Kjkyq6zv-bw5bPKFNXORtgbAi6OPOqDQaFoyKTMFwgg";
export const BUCKET_NAME = "profile-pictures";
export const DEBT_RECEIPTS_BUCKET = "debt-receipts";

export const supabase = createClient(supabaseUrl, supabaseKey);
