/**
 * Account emails from BOOPbase (password reset, verify email).
 * Sends through Resend only when ALL of these are set on the server:
 *   BOOP_AUTH_EMAIL_ENABLED=true, RESEND_API_KEY, BOOP_EMAIL_FROM
 * Otherwise it is a no-op: nothing leaves the server. Outside production the link is
 * logged to the server console so the flow can be tested locally. Never throws.
 */
export type AuthMail = { to: string; subject: string; text: string; html: string; devLink?: string };
export type MailResult = { sent: boolean; reason?: string };

export const BOOP_REPLY_TO = 'heyeasy@easydidit.com';

export function mailerConfig(env: Record<string, string | undefined> = process.env) {
  const key = env.RESEND_API_KEY?.trim();
  const from = env.BOOP_EMAIL_FROM?.trim();
  if (env.BOOP_AUTH_EMAIL_ENABLED !== 'true' || !key || !from) return null;
  return { key, from };
}

export async function sendAuthMail(mail: AuthMail, env: Record<string, string | undefined> = process.env): Promise<MailResult> {
  const cfg = mailerConfig(env);
  if (!cfg) {
    if (env.NODE_ENV !== 'production' && mail.devLink) {
      console.info(`[auth-email no-op] "${mail.subject}" link: ${mail.devLink}`);
    } else {
      console.info(JSON.stringify({ msg: 'auth_email.skipped', subject: mail.subject }));
    }
    return { sent: false, reason: 'email not configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: cfg.from, to: [mail.to], reply_to: BOOP_REPLY_TO, subject: mail.subject, text: mail.text, html: mail.html }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(JSON.stringify({ msg: 'auth_email.failed', status: res.status }));
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error(JSON.stringify({ msg: 'auth_email.error', error: (err as Error).message }));
    return { sent: false, reason: 'network' };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

function wrap(heading: string, body: string, cta: string, link: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#111">
<h2 style="margin:0 0 12px">${esc(heading)}</h2>
<p style="line-height:1.5">${esc(body)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">${esc(cta)}</a></p>
<p style="font-size:12px;color:#666;line-height:1.5">If the button doesn't work, copy this link: ${esc(link)}</p>
<p style="font-size:12px;color:#666">BOOP · Building Opportunities One Profile at a Time</p>
</div>`;
}

export function passwordResetMail(to: string, link: string): AuthMail {
  const body = 'Someone asked to reset the password for your BOOP page. This link works once and expires in 1 hour. If it was not you, ignore this email and your password stays the same.';
  return {
    to,
    subject: 'Reset your BOOP password',
    text: `${body}\n\nReset your password: ${link}\n\nBOOP · Building Opportunities One Profile at a Time`,
    html: wrap('Reset your password', body, 'Reset password', link),
    devLink: link,
  };
}

export function verifyEmailMail(to: string, link: string): AuthMail {
  const body = 'Confirm this is your email for your BOOP page. We use it for sign-in and password resets. The link expires in 24 hours.';
  return {
    to,
    subject: 'Confirm your email for BOOP',
    text: `${body}\n\nConfirm your email: ${link}\n\nBOOP · Building Opportunities One Profile at a Time`,
    html: wrap('Confirm your email', body, 'Confirm email', link),
    devLink: link,
  };
}
