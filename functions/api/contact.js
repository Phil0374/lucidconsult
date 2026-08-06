// Cloudflare Pages Function — /api/contact
// Requires RESEND_API_KEY set in Cloudflare Pages environment variables.
// Without it, submissions are logged but not forwarded.

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const company = (body.company || "").trim();
    const interest = (body.interest || "").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set. Logging submission.");
      console.log(JSON.stringify({ name, email, company, interest, message }));
      return new Response(JSON.stringify({ ok: true, configured: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const to = "info@lucidconsult.ai";
    const from = "LucidConsult Contact <noreply@lucidconsult.ai>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New inquiry from ${name}${company ? ` (${company})` : ""}`,
        reply_to: email,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Company: ${company || "—"}`,
          `Interest: ${interest || "Not specified"}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return new Response(JSON.stringify({ error: "Failed to send" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
