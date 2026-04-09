import { SupabaseClient } from "@supabase/supabase-js";

export async function uploadSpeakingRecording(
  supabase: SupabaseClient,
  userId: string,
  blob: Blob,
  mimeType: string,
): Promise<{ path: string }> {
  const filename = `${userId}/${crypto.randomUUID()}.webm`;

  const { error } = await supabase.storage
    .from("speaking-recordings")
    .upload(filename, blob, { contentType: mimeType });

  if (error) throw error;

  return { path: filename };
}
