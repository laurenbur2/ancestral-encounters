// Supabase Edge Function: contact
//
// Receives contact-form submissions from the website, stores them in the
// `contact_messages` table, and emails the team via Resend. The submitter's
// email is set as reply-to so replies in your inbox go straight back to them.
//
// Secrets (set with `supabase secrets set` or in the dashboard):
//   RESEND_API_KEY   Resend API key (re_...)
//   CONTACT_FROM     Verified Resend sender, e.g. "Ancestral Encounters <hello@yourdomain.com>"
//   CONTACT_TO       Comma-separated recipients, e.g. "encuentrosancestralesmx@gmail.com,lburandt2@gmail.com"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let data: Record<string, string>;
  try {
    data = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success, drop it.
  if (data.website) return json({ success: true });

  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const message = (data.message || "").trim();
  const interest = (data.interest || "").trim();

  if (!name || !email || !message) {
    return json({ error: "Missing required fields" }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "Invalid email" }, 400);
  }

  // Store the submission (service role bypasses RLS).
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error: dbError } = await supabase
    .from("contact_messages")
    .insert({ name, email, interest: interest || null, message });
  if (dbError) {
    console.error("DB insert failed:", dbError.message);
    // Keep going — we'd still rather deliver the email than lose the message.
  }

  // Email the team via Resend.
  const to = (Deno.env.get("CONTACT_TO") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = Deno.env.get("CONTACT_FROM") || "";
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";

  if (!resendKey || !from || to.length === 0) {
    console.error("Email not configured (RESEND_API_KEY / CONTACT_FROM / CONTACT_TO)");
    return json({ success: false, error: "Email not configured" }, 500);
  }

  const html =
    `<h2>New message from the Ancestral Encounters website</h2>` +
    `<p><strong>Name:</strong> ${esc(name)}</p>` +
    `<p><strong>Email:</strong> ${esc(email)}</p>` +
    (interest ? `<p><strong>Drawn to:</strong> ${esc(interest)}</p>` : "") +
    `<p><strong>Message:</strong></p>` +
    `<p>${esc(message).replace(/\n/g, "<br>")}</p>`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `New website message from ${name}`,
      html,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("Resend failed:", resp.status, detail);
    return json({ success: false, error: "Email send failed" }, 502);
  }

  return json({ success: true });
});
