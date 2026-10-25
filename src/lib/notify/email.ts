import "server-only"

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagalagasofa.broslunas.com"

/** Correo de alerta de precio, con enlace para gestionar o desactivar los avisos. */
export function priceAlertEmail(opts: { to: string; title: string; body: string; url: string }): EmailMessage {
  const link = `${siteUrl()}${opts.url}`
  const settings = `${siteUrl()}/ajustes/notificaciones`
  const text = `${opts.title}\n\n${opts.body}\n\nVer gasolinera: ${link}\n\nRecibes este correo porque activaste una alerta de precio. Puedes desactivarla en ${settings}`
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f5f1;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#10231f">
<div style="max-width:480px;margin:0 auto;padding:24px 16px">
  <p style="margin:0 0 16px;font-weight:700;color:#14886a">PagaLaGasofa</p>
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e3e6e1">
    <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3">${escapeHtml(opts.title)}</h1>
    <p style="margin:0 0 20px;color:#4a5a57;line-height:1.5">${escapeHtml(opts.body)}</p>
    <a href="${escapeHtml(link)}" style="display:inline-block;background:#14886a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">Ver gasolinera</a>
  </div>
  <p style="margin:16px 0 0;font-size:12px;color:#6b7a77;line-height:1.5">Recibes este correo porque activaste una alerta de precio. <a href="${escapeHtml(settings)}" style="color:#6b7a77">Gestionar avisos</a>.</p>
</div></body></html>`
  return { to: opts.to, subject: opts.title, text, html }
}

export const isEmailConfigured = () =>
  Boolean(process.env.MAILJET_API_KEY && process.env.MAILJET_API_SECRET && process.env.MAILJET_FROM_EMAIL)

/** Envía con la API v3.1 de Mailjet. Con `MAILJET_SANDBOX=1` solo valida el mensaje. Nunca lanza. */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!isEmailConfigured()) return false
  const auth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_API_SECRET}`).toString("base64")
  try {
    const res = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        SandboxMode: process.env.MAILJET_SANDBOX === "1",
        Messages: [
          {
            From: { Email: process.env.MAILJET_FROM_EMAIL, Name: process.env.MAILJET_FROM_NAME ?? "PagaLaGasofa" },
            To: [{ Email: message.to }],
            Subject: message.subject,
            TextPart: message.text,
            HTMLPart: message.html,
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => null)) as { Messages?: { Status?: string }[] } | null
    const ok = res.ok && data?.Messages?.[0]?.Status === "success"
    if (!ok) console.warn("sendEmail: Mailjet respondió", res.status, data?.Messages?.[0]?.Status)
    return ok
  } catch (error) {
    console.warn("sendEmail:", (error as Error).message)
    return false
  }
}
