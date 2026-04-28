import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Path looks like /redirect/<code> when invoked via /functions/v1/redirect/<code>
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[parts.length - 1];

  if (!code || !/^[A-Za-z0-9]{1,16}$/.test(code)) {
    return new Response(JSON.stringify({ error: "Invalid short code" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(SUPABASE_URL, ANON);
  const { data, error } = await sb.rpc("increment_click", { _short_code: code });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!data || data.length === 0) {
    return new Response(JSON.stringify({ error: "Short code not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const row = data[0] as { long_url: string | null; expires_at: string };
  if (!row.long_url) {
    return new Response(JSON.stringify({ error: "This URL has expired" }), {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: row.long_url },
  });
});