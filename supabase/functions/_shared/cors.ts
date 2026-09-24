// Shared CORS headers for the journal AI functions. Mirrors what
// suggest-chapters / suggest-value-challenges already need to be callable
// from the browser via supabase.functions.invoke.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
