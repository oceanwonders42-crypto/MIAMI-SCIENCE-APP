/**
 * Email notification service layer.
 * Sending is triggered from jobs/actions only — do not call from random UI paths.
 * Wire to Resend/SendGrid by implementing sendViaTransport and setting env (e.g. RESEND_API_KEY).
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Optional from address; default from env or no-reply. */
  from?: string;
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Send an email. When no transport is configured, logs and returns ok (no-op in production) or logs in dev.
 * Implement sendViaTransport for real delivery (e.g. Resend).
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html } = options;
  const transport = getTransport();
  if (transport) {
    return transport(options);
  }
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[email] (no transport) would send to:", to, "subject:", subject);
  }
  return { ok: true };
}

type Transport = (options: SendEmailOptions) => Promise<SendEmailResult>;

function getTransport(): Transport | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return resendTransport(key);
}

/**
 * Resend.com transport. Use when RESEND_API_KEY is set.
 */
function resendTransport(apiKey: string): Transport {
  return async (options: SendEmailOptions): Promise<SendEmailResult> => {
    try {
      const from = options.from ?? process.env.EMAIL_FROM ?? "notifications@mia-science.com";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, error: `Resend: ${res.status} ${err}` };
      }
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, error: message };
    }
  };
}
