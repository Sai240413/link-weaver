import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
 
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function base62(n: number): string {
  if (n === 0) return "0";
  let s = "";
  while (n > 0) {
    s = ALPHABET[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s;
}

function isValidUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const longUrl = (body.longUrl ?? "").toString().trim();
    const isPrivate = !!body.isPrivate;
    const customExpiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!longUrl || longUrl.length > 2048 || !isValidUrl(longUrl)) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify caller (if signed in) using their JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    if (isPrivate && !userId) {
      return new Response(
        JSON.stringify({ error: "Sign in required for private URLs" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let expiresAt: Date;
    if (customExpiresAt && userId) {
      if (isNaN(customExpiresAt.getTime()) || customExpiresAt <= new Date()) {
        return new Response(JSON.stringify({ error: "expiresAt must be a future date" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      expiresAt = customExpiresAt;
    } else {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Use service role to insert (bypasses RLS so we can also set short_code in same flow)
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: inserted, error: insertErr } = await admin
      .from("urls")
      .insert({
        long_url: longUrl,
        is_private: isPrivate,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    const shortCode = base62(Number(inserted.id));
    const { data: updated, error: updErr } = await admin
      .from("urls")
      .update({ short_code: shortCode })
      .eq("id", inserted.id)
      .select("*")
      .single();
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ url: updated, shortCode }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});