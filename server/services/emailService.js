const RESEND_URL = 'https://api.resend.com/emails';

function config() {
  return {
    apiKey: String(process.env.RESEND_API_KEY || '').trim(),
    from: String(process.env.EMAIL_FROM || 'ESNAS DRC <onboarding@resend.dev>').trim(),
    replyTo: String(process.env.EMAIL_REPLY_TO || '').trim(),
  };
}

export function isEmailConfigured() {
  return Boolean(config().apiKey && config().from);
}

export async function sendEmail({ to, subject, text, html = null }) {
  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient || !subject || !text) throw new TypeError('to, subject and text are required.');

  const settings = config();
  if (!settings.apiKey) {
    console.warn('[email] RESEND_API_KEY absent; message remains queued:', subject);
    return { sent: false, queued: true, reason: 'provider_not_configured' };
  }

  const payload = {
    from: settings.from,
    to: [recipient],
    subject: String(subject).slice(0, 255),
    text: String(text),
  };
  if (html) payload.html = String(html);
  if (settings.replyTo) payload.reply_to = settings.replyTo;

  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Email provider returned ${response.status}.`);
  }
  return { sent: true, id: result.id || null };
}
