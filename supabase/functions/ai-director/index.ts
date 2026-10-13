// RAZTARA AI Director — owner-only, minimal health check.
// This endpoint deliberately does not read private messages, run SQL, write data,
// modify users, deploy code, spend money, or issue payouts.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const ownerId = Deno.env.get("AI_DIRECTOR_OWNER_ID");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  if (!supabaseUrl || !anonKey || !ownerId || !geminiKey) {
    return json({ error: "AI Director is not configured. Required server secrets are missing." }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sign-in required" }, 401);

  // Verify the JWT with Supabase Auth; never trust a user ID supplied in request JSON.
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authHeader },
  });
  if (!userResponse.ok) return json({ error: "Invalid or expired session" }, 401);

  const user = await userResponse.json();
  if (typeof user?.id !== "string" || user.id !== ownerId) {
    return json({ error: "Owner access only" }, 403);
  }

  let body: { action?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (body?.action !== "health_check") {
    return json({ error: "Only the health_check action is enabled in this initial version" }, 400);
  }

  // Fixed prompt only; callers cannot submit arbitrary prompts or private data.
  const geminiResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with exactly: RAZTARA_AI_DIRECTOR_OK" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 20 },
      }),
    },
  );

  if (!geminiResponse.ok) {
    // Do not return provider response bodies because they may contain sensitive details.
    return json({ status: "error", error: "Gemini health check failed", provider_status: geminiResponse.status }, 502);
  }

  const result = await geminiResponse.json();
  const text = result?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text.includes("RAZTARA_AI_DIRECTOR_OK")) {
    return json({ status: "error", error: "Unexpected response from Gemini" }, 502);
  }

  return json({
    status: "ok",
    service: "RAZTARA AI Director",
    checks: { authentication: "ok", owner_authorization: "ok", gemini: "ok" },
    mode: "health_check_only",
    note: "No app data was read or changed.",
  });
});
