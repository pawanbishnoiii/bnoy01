import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const input = z.object({
  kind: z.enum(['short', 'full', 'tech', 'seo']),
  title: z.string().max(200).default(''),
  short_desc: z.string().max(2000).default(''),
  full_desc: z.string().max(8000).default(''),
  project_type: z.string().max(40).default('website'),
});

const SCHEMAS: Record<string, any> = {
  short: { text: { type: 'string', description: 'Catchy honest summary, max 160 characters' } },
  full: { text: { type: 'string', description: 'Markdown description with headings and a feature bullet list, 150-300 words' } },
  tech: { tech: { type: 'array', items: { type: 'string' }, description: '6-12 likely technologies, proper names like React, Supabase, Tailwind CSS' } },
  seo: { seo_title: { type: 'string', description: 'max 60 chars' }, seo_description: { type: 'string', description: 'max 155 chars' }, keywords: { type: 'array', items: { type: 'string' }, description: '6-10 search keywords' } },
};

/** Admin-only AI helper for the project editor: descriptions, tech stack and SEO. */
export const aiProjectAssist = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Only admins can use AI here.');
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error('AI is not configured.');
    const props = SCHEMAS[data.kind];
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You help list software source-code products on a marketplace. Be honest; never invent features not implied by the given info.' },
          { role: 'user', content: `Type: ${data.project_type}\nTitle: ${data.title}\nShort description: ${data.short_desc}\nFull description: ${data.full_desc.slice(0, 4000)}` },
        ],
        tools: [{ type: 'function', function: { name: 'out', description: 'Return result', parameters: { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false } } }],
        tool_choice: { type: 'function', function: { name: 'out' } },
      }),
    });
    if (res.status === 429) throw new Error('Too many requests — retry in a minute.');
    if (res.status === 402) throw new Error('AI credits exhausted.');
    if (!res.ok) throw new Error('AI request failed.');
    const json = (await res.json()) as any;
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error('AI returned nothing.');
    return JSON.parse(args) as { text?: string; tech?: string[]; seo_title?: string; seo_description?: string; keywords?: string[] };
  });
