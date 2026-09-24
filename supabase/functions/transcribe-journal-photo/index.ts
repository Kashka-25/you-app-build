// transcribe-journal-photo — downloads a private journal photo the user
// already uploaded, sends it to Claude vision for handwriting transcription,
// and saves the result back onto the journal_photos row. The user reviews
// and can edit the transcription afterward (see JournalEntryModal) — this
// only ever produces a first draft.
//
// Deploy: supabase functions deploy transcribe-journal-photo
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You transcribe photos of handwritten journal pages for a personal journaling app. Transcribe the handwritten text exactly as written, preserving line breaks where they carry meaning (e.g. between paragraphs or list items). Do not summarize, correct grammar, or add anything that is not on the page. If a word or phrase is illegible, write [illegible] in its place. Respond with the transcribed text only — no preamble, no commentary, no markdown.`;

function extToMediaType(ext: string): string {
  const map: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic" };
  return map[ext.toLowerCase()] || "image/jpeg";
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { photoId } = await req.json();
    if (!photoId) return json({ error: "photoId is required" }, 400);

    const { data: photo, error: photoErr } = await supabase
      .from("journal_photos")
      .select("id, storage_path")
      .eq("id", photoId)
      .eq("user_id", user.id)
      .single();
    if (photoErr || !photo) return json({ error: "Photo not found" }, 404);

    const { data: fileBlob, error: dlErr } = await supabase.storage.from("journal-photos").download(photo.storage_path);
    if (dlErr || !fileBlob) {
      await supabase.from("journal_photos").update({ transcription_status: "failed" }).eq("id", photoId);
      return json({ error: dlErr?.message || "Could not download photo" }, 500);
    }

    const bytes = new Uint8Array(await fileBlob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const ext = photo.storage_path.split(".").pop() || "jpg";

    try {
      const transcription = await callClaude({
        system: SYSTEM_PROMPT,
        maxTokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: extToMediaType(ext), data: base64 } },
              { type: "text", text: "Transcribe this handwritten journal page." }
            ]
          }
        ]
      });

      const { data: saved, error: saveErr } = await supabase
        .from("journal_photos")
        .update({ transcription: transcription.trim(), transcription_status: "done" })
        .eq("id", photoId)
        .select()
        .single();
      if (saveErr) return json({ error: saveErr.message }, 500);
      return json({ photo: saved });
    } catch (claudeErr) {
      await supabase.from("journal_photos").update({ transcription_status: "failed" }).eq("id", photoId);
      throw claudeErr;
    }
  } catch (e) {
    console.error("[transcribe-journal-photo]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
