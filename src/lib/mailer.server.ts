// Personal Gmail SMTP sender. Uses worker-mailer on the published Worker runtime
// and nodemailer in the Node dev server. Credentials come from SMTP_USER / SMTP_PASS.
type Theme = { accent_color: string; logo_url: string | null; footer_text: string; from_name: string; signup_enabled: boolean; booking_enabled: boolean; product_enabled: boolean };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function getTheme(): Promise<Theme> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('email_theme').select('*').eq('id', true).maybeSingle();
  return (data as Theme) ?? { accent_color: '#f97316', logo_url: null, footer_text: 'Bnoy Studios', from_name: 'Bnoy Studios', signup_enabled: true, booking_enabled: true, product_enabled: true };
}

const DEFAULT_LOGO = 'https://bnoy01.lovable.app/__l5e/assets-v1/75fb4eff-d6f7-4625-931f-5a79f014a80c/bnoy-logo.png';
export function renderEmail(theme: Theme, o: { title: string; intro: string; rows?: [string, string][]; cta?: { label: string; url: string }; banner?: string; code?: string }) {
  const a = theme.accent_color;
  const logoUrl = theme.logo_url || DEFAULT_LOGO;
  const rows = (o.rows || []).map(([k, v]) => `<tr><td style="padding:12px 16px;background:#fafaf9;border-radius:12px;color:#57534e;font-size:13px;width:42%">${esc(k)}</td><td style="padding:12px 16px;color:#1c1917;font-size:14px;font-weight:600">${esc(v)}</td></tr><tr><td colspan="2" style="height:6px"></td></tr>`).join('');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f5f4;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 12px"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.08)">
<tr><td style="padding:24px 28px 8px"><table width="100%"><tr><td><img src="${esc(logoUrl)}" alt="${esc(theme.from_name)}" height="36" style="height:36px;display:block;border-radius:10px"></td><td align="right" style="color:#a8a29e;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${esc(theme.from_name)}</td></tr></table></td></tr>
${o.banner ? `<tr><td style="padding:12px 20px 0"><img src="${esc(o.banner)}" alt="" width="540" style="width:100%;display:block;border-radius:20px"></td></tr>` : `<tr><td style="padding:12px 20px 0"><div style="height:8px;border-radius:99px;background:linear-gradient(90deg,${a},#fbbf24)"></div></td></tr>`}
<tr><td style="padding:28px 32px 4px;color:#1c1917;font-size:28px;font-weight:800;letter-spacing:-.02em">${esc(o.title)}</td></tr>
<tr><td style="padding:8px 32px 8px;color:#57534e;font-size:15px;line-height:1.7">${esc(o.intro)}</td></tr>
${o.code ? `<tr><td align="center" style="padding:16px 32px"><div style="display:inline-block;padding:16px 28px;border-radius:18px;background:#fff7ed;border:2px dashed ${a};font-size:34px;font-weight:800;letter-spacing:.4em;color:#1c1917">${esc(o.code)}</div></td></tr>` : ''}
${rows ? `<tr><td style="padding:12px 32px"><table width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>` : ''}
${o.cta ? `<tr><td style="padding:20px 32px 8px"><a href="${esc(o.cta.url)}" style="background:${a};color:#fff;text-decoration:none;padding:15px 30px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px">${esc(o.cta.label)} &rarr;</a></td></tr>` : ''}
<tr><td style="padding:28px 32px 32px;color:#a8a29e;font-size:12px;border-top:1px solid #f5f5f4">${esc(theme.footer_text)}</td></tr>
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
