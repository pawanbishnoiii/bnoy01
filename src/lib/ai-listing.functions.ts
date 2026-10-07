import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

const input = z.object({
  name: z.string().trim().min(2).max(120),
  features: z.string().trim().min(3).max(2000),
  audience: z.string().trim().min(2).max(500),
});

export const generateListing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Only admins can generate listings.');
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error('AI is not configured.');
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You write compelling, honest marketplace listings for software source-code products. Never invent features not given.' },
          { role: 'user', content: `Project name: ${data.name}\nKey features: ${data.features}\nTarget audience: ${data.audience}` },
        ],
        tools: [{ type: 'function', function: { name: 'listing', description: 'Return the marketplace listing', parameters: { type: 'object', properties: {
          short_desc: { type: 'string', description: 'Catchy summary, max 160 characters' },
          full_desc: { type: 'string', description: 'Markdown description with headings and bullet list of features, 150-300 words' },
          tags: { type: 'array', items: { type: 'string' }, description: '5-8 short lowercase tags' },
          seo_title: { type: 'string', description: 'Max 60 chars' },
        }, required: ['short_desc', 'full_desc', 'tags', 'seo_title'], additionalProperties: false } } }],
        tool_choice: { type: 'function', function: { name: 'listing' } },
      }),
    });
    if (res.status === 429) throw new Error('Too many requests — please retry in a minute.');
    if (res.status === 402) throw new Error('AI credits exhausted. Add credits in workspace settings.');
    if (!res.ok) throw new Error('AI generation failed.');
    const json = await res.json() as any;
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error('AI returned no listing.');
    const out = JSON.parse(args) as { short_desc: string; full_desc: string; tags: string[]; seo_title: string };
    return { ...out, short_desc: out.short_desc.slice(0, 160), tags: out.tags.slice(0, 8) };
  });
