// Personal Gmail SMTP sender. Uses worker-mailer on the published Worker runtime
// and nodemailer in the Node dev server. Credentials come from SMTP_USER / SMTP_PASS.
type Theme = { accent_color: string; logo_url: string | null; footer_text: string; from_name: string; signup_enabled: boolean; booking_enabled: boolean; product_enabled: boolean };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function getTheme(): Promise<Theme> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('email_theme').select('*').eq('id', true).maybeSingle();
  return (data as Theme) ?? { accent_color: '#f97316', logo_url: null, footer_text: 'Bnoy Studios', from_name: 'Bnoy Studios', signup_enabled: true, booking_enabled: true, product_enabled: true };
}

export function renderEmail(theme: Theme, o: { title: string; intro: string; rows?: [string, string][]; cta?: { label: string; url: string } }) {
  const a = theme.accent_color;
  const logo = theme.logo_url ? `<img src="${esc(theme.logo_url)}" alt="${esc(theme.from_name)}" height="40" style="height:40px;display:block;margin:0 auto 12px">` : '';
  const rows = (o.rows || []).map(([k, v]) => `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">${esc(k)}</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600">${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:24px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #f1f1f1;border-radius:20px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,${a},#111827);padding:32px 24px;text-align:center">${logo}<div style="color:#fff;font-size:22px;font-weight:800">${esc(o.title)}</div></td></tr>
<tr><td style="padding:28px 28px 8px;color:#374151;font-size:15px;line-height:1.6">${esc(o.intro)}</td></tr>
${rows ? `<tr><td style="padding:0 28px"><table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:12px 0">${rows}</table></td></tr>` : ''}
${o.cta ? `<tr><td align="center" style="padding:20px 28px"><a href="${esc(o.cta.url)}" style="background:${a};color:#fff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:700;display:inline-block">${esc(o.cta.label)}</a></td></tr>` : ''}
<tr><td style="padding:20px 28px 28px;color:#9ca3af;font-size:12px;text-align:center">${esc(theme.footer_text)}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendMail(to: string, subject: string, html: string, template: string) {
  const user = process.env['SMTP_USER'];
  const pass = process.env['SMTP_PASS'];
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const theme = await getTheme();
  let error: string | null = null;
  try {
    if (!user || !pass) throw new Error('SMTP credentials missing');
    const isWorker = typeof (globalThis as any).WebSocketPair !== 'undefined';
    if (isWorker) {
      const { WorkerMailer } = await import('worker-mailer');
      await WorkerMailer.send(
        { host: 'smtp.gmail.com', port: 465, secure: true, credentials: { username: user, password: pass }, authType: 'plain' },
        { from: { name: theme.from_name, email: user }, to: { email: to }, subject, html },
      );
    } else {
      const nodemailer = (await import('nodemailer')).default;
      const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
      await t.sendMail({ from: `"${theme.from_name}" <${user}>`, to, subject, html });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('[mailer]', error);
  }
  await supabaseAdmin.from('email_logs').insert({ to_email: to, template, subject, status: error ? 'failed' : 'sent', error });
  return { sent: !error, error };
}
