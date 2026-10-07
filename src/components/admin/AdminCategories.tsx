import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await supabase.from('categories').select('*').order('name')).data || [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { error } = await supabase.from('categories').insert({ name: name.trim(), slug, icon: icon.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setName(''); setIcon('');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('categories').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category removed' });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold">Categories</h1>
      <div className="bg-white rounded-xl border border-border shadow-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dashboards" className="bg-warm-bg border-border" /></div>
          <div className="space-y-1.5"><Label>Icon (lucide name)</Label><Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. layout-dashboard" className="bg-warm-bg border-border" /></div>
          <div className="flex items-end">
            <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending} className="w-full gradient-fire-strong text-white">
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {(categories || []).map((c: any) => (
            <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fire/10 text-fire text-sm font-semibold">
              {c.name}
              <button onClick={() => remove.mutate(c.id)} className="hover:text-destructive" aria-label="remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {(!categories || categories.length === 0) && <p className="text-sm text-muted-foreground">No categories yet.</p>}
        </div>
      </div>
    </div>
  );
}
