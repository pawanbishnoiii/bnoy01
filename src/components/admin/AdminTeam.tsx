import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['team_members']['Row'];
const empty = { name: '', expertise: '', image_url: '', website_url: '', linkedin_url: '', instagram_url: '', github_url: '', x_url: '', sort_order: 0, published: false };
export default function AdminTeam() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<typeof empty & { id?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: members = [], error } = useQuery({ queryKey: ['admin-team'], queryFn: async () => {
    const { data, error } = await supabase.from('team_members').select('*').order('sort_order');
    if (error) throw error;
    return data || [];
  } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-team'] }); qc.invalidateQueries({ queryKey: ['public-team'] }); };
  const remove = async (member: Member) => {
    if (!window.confirm(`Delete ${member.name}?`)) return;
    const { error } = await supabase.from('team_members').delete().eq('id', member.id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); else refresh();
  };
  return <div className="space-y-6 max-w-4xl">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Creative Team</h1><Button onClick={() => setForm({ ...empty })}><Plus className="h-4 w-4" />Add member</Button></div>
    {error && <p role="alert" className="text-destructive">Team could not load. Please retry.</p>}
    {form && <form className="border-y border-border py-6 space-y-4" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      const { id, ...payload } = form;
      const { error } = id ? await supabase.from('team_members').update(payload).eq('id', id) : await supabase.from('team_members').insert(payload);
      setBusy(false);
      if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      else { refresh(); setForm(null); toast({ title: 'Team member saved' }); }
    }}>
      <div className="grid sm:grid-cols-2 gap-4">
        {(['name', 'expertise', 'image_url', 'website_url', 'linkedin_url', 'instagram_url', 'github_url', 'x_url'] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={`team-${key}`}>{key.replace(/_/g, ' ')}</Label><Input id={`team-${key}`} type={key.endsWith('url') && key !== 'image_url' ? 'url' : 'text'} required={key === 'name' || key === 'expertise'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}
        <div className="space-y-2"><Label htmlFor="team-order">Display order</Label><Input id="team-order" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
        <div className="flex items-center gap-3"><Switch id="team-published" checked={form.published} onCheckedChange={published => setForm({ ...form, published })} /><Label htmlFor="team-published">Published</Label></div>
      </div>
      <div className="flex gap-2"><Button disabled={busy} type="submit"><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save member'}</Button><Button type="button" variant="outline" onClick={() => setForm(null)}><X className="h-4 w-4" />Cancel</Button></div>
    </form>}
    <div className="divide-y divide-border">{members.map(member => <div key={member.id} className="flex items-center gap-4 py-4">
      {member.image_url && <img src={member.image_url} alt={member.name} className="w-14 h-16 object-cover rounded-md" />}
      <div className="flex-1 min-w-0"><h2 className="font-semibold break-words">{member.name}</h2><p className="text-sm text-muted-foreground">{member.expertise} · {member.published ? 'Published' : 'Draft'}</p></div>
      <Button variant="ghost" size="icon" aria-label={`Edit ${member.name}`} onClick={() => setForm(member)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${member.name}`} onClick={() => remove(member)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>)}</div>
  </div>;
}