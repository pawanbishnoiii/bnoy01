import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Send, Trash2, ImagePlus, Users2, User, Smartphone, Monitor, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Form = {
  title: string;
  body: string;
  banner_url: string;
  tag: string;
  url: string;
  audience: 'all' | 'user';
  target_user_id: string;
};

const EMPTY: Form = { title: '', body: '', banner_url: '', tag: '', url: '/', audience: 'all', target_user_id: '' };

export default function AdminNotifications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v } as Form));

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['admin-push-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('push_subscribers').select('id, user_id, platform, created_at');
      if (error) throw error;
      return data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-basic'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name, email').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const mobile = subscribers.filter((s) => s.platform === 'mobile').length;
  const desktop = subscribers.length - mobile;

  const uploadBanner = async (file: File) => {
    setUploading(true);
    try {
      const path = `notifications/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from('project-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('project-assets').getPublicUrl(path);
      set('banner_url', data.publicUrl);
      toast({ title: 'Banner uploaded' });
    } catch (e) {
      toast({ title: 'Upload failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const send = useMutation({
    mutationFn: async (mode: 'save' | 'send') => {
      if (!form.title.trim()) throw new Error('Title is required');
      if (form.audience === 'user' && !form.target_user_id) throw new Error('Select a user');

      const { data: created, error } = await supabase
        .from('notifications')
        .insert({
          title: form.title.trim(),
          body: form.body.trim(),
          banner_url: form.banner_url || null,
          tag: form.tag || null,
          url: form.url || '/',
          audience: form.audience,
          target_user_id: form.audience === 'user' ? form.target_user_id : null,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      if (mode === 'save') return { sent: 0, failed: 0 };
      return await pushNow(created.id);
    },
    onSuccess: (res) => {
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({ title: res.sent ? `Sent to ${res.sent} device(s) 🔔` : 'Saved as draft', description: res.failed ? `${res.failed} failed` : undefined });
    },
    onError: (e) => toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' }),
  });

  async function pushNow(id: string) {
    const { data, error } = await supabase.functions.invoke('send-notification', { body: { notificationId: id } });
    if (error) {
      let details = error.message;
      try { details = await (error as unknown as { context: Response }).context.text(); } catch { /* ignore */ }
      throw new Error(details);
    }
    return data as { sent: number; failed: number };
  }

  const resend = async (id: string) => {
    setSendingId(id);
    try {
      const res = await pushNow(id);
      toast({ title: `Sent to ${res.sent} device(s)`, description: res.failed ? `${res.failed} failed` : undefined });
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    } catch (e) {
      toast({ title: 'Send failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSendingId(null);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    qc.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const stats = [
    { label: 'Subscribed devices', value: subscribers.length, icon: Bell },
    { label: 'Mobile', value: mobile, icon: Smartphone },
    { label: 'Desktop', value: desktop, icon: Monitor },
    { label: 'Notifications sent', value: notifications.filter((n) => n.status === 'sent').length, icon: Send },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Push Notifications</h1>
        <p className="text-sm text-muted-foreground">Compose and push web notifications to every subscriber or a single user.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white p-4 min-w-0"
          >
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              <s.icon className="h-3.5 w-3.5" /> <span className="truncate">{s.label}</span>
            </div>
            <p className="font-display text-2xl font-extrabold text-ink mt-1 tabular-nums">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        {/* Composer */}
        <div className="rounded-2xl border border-border bg-white p-5 space-y-4 min-w-0">
          <h2 className="font-display font-bold text-ink">Compose</h2>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="New project released 🎉" maxLength={120} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Grab the new dashboard template at 40% off." rows={3} maxLength={400} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tag (groups notifications)</Label>
              <Input value={form.tag} onChange={(e) => set('tag', e.target.value)} placeholder="release" />
            </div>
            <div className="space-y-2">
              <Label>Click URL</Label>
              <Input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="/marketplace" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banner image</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm cursor-pointer hover:bg-muted transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
              </label>
              <Input value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)} placeholder="https://…" className="flex-1 min-w-[180px]" />
            </div>
            {form.banner_url && (
              <img src={form.banner_url} alt="Notification banner preview" className="w-full aspect-[16/9] object-cover rounded-xl border border-border" loading="lazy" />
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => set('audience', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subscribers</SelectItem>
                  <SelectItem value="user">Specific user</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience === 'user' && (
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={form.target_user_id} onValueChange={(v) => set('target_user_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: { id: string; name: string | null; email: string | null }) => (
                      <SelectItem key={u.id} value={u.id}>{u.name || u.email || u.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={() => send.mutate('send')} disabled={send.isPending} className="rounded-xl">
              {send.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send now
            </Button>
            <Button variant="outline" onClick={() => send.mutate('save')} disabled={send.isPending} className="rounded-xl">Save draft</Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-3 min-w-0">
          <h2 className="font-display font-bold text-ink">Preview</h2>
          <div className="rounded-2xl bg-white border border-border shadow-lg overflow-hidden">
            {form.banner_url && <img src={form.banner_url} alt="" className="w-full aspect-[16/9] object-cover" loading="lazy" />}
            <div className="p-4 flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{form.title || 'Notification title'}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{form.body || 'Your description appears here.'}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{form.url || '/'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Delivered in real time to {form.audience === 'all' ? `${subscribers.length} subscribed device(s)` : 'the selected user’s devices'} on mobile and desktop.
          </p>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="font-display font-bold text-ink">History</h2>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No notifications yet — compose your first one above.</div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 flex items-center gap-3 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink text-sm truncate">{n.title}</p>
                      <Badge variant={n.status === 'sent' ? 'default' : n.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {n.status === 'sent' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : n.status === 'failed' ? <XCircle className="h-3 w-3 mr-1" /> : null}
                        {n.status}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {n.audience === 'all' ? <Users2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        {n.audience === 'all' ? 'All' : 'Single user'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                    {n.status !== 'draft' && (
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {n.sent_count} delivered · {n.failed_count} failed
                        {n.error ? ` · ${n.error.slice(0, 80)}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl" disabled={sendingId === n.id} onClick={() => resend(n.id)}>
                      {sendingId === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span className="ml-1 hidden sm:inline">{n.status === 'sent' ? 'Resend' : 'Send'}</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-destructive" onClick={() => remove(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
