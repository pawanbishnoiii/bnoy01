import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Bot, Send, Sparkles, Loader2, RefreshCw, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'How do I download my purchase?',
  'Where can I find older versions?',
  'What license do I get?',
  'How do I deploy this project?',
];

/**
 * Profile-page AI helper. Uses the Lovable AI gateway through the `ai-chat`
 * edge function with the admin-configured system prompt. Includes skeleton,
 * retry and empty states.
 */
export default function AIHelper() {
  const reduced = usePrefersReducedMotion();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  const systemPrompt = ((settings as any)?.ai_system_prompt || '').trim();

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages, reduced]);

  const send = async (text: string, history = messages) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setError(null);
    const next = [...history, { role: 'user' as const, content: trimmed }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      void supabase;
      const res = await fetch(`/api/public/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, systemPrompt }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 429 ? 'Too many requests — try again shortly.' : 'Assistant is unavailable right now.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => m.map((msg, i) => (i === m.length - 1 ? { ...msg, content: acc } : msg)));
            }
          } catch { /* ignore partial chunks */ }
        }
      }
      if (!acc) throw new Error('No response received.');
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
      setMessages((m) => m.filter((msg, i) => !(i === m.length - 1 && msg.role === 'assistant' && !msg.content)));
    } finally {
      setStreaming(false);
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const history = messages.slice(0, messages.findIndex((m) => m === lastUser));
    if (lastUser) send(lastUser.content, history);
  };

  return (
    <div className="rounded-3xl iris-panel overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border/60">
        <div className="h-10 w-10 rounded-2xl gradient-iris flex items-center justify-center glow-iris shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold leading-tight">Bnoy Assistant</p>
          <p className="text-xs text-muted-foreground truncate">Help with purchases, versions & deployment</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-iris shrink-0">
          <Sparkles className="h-3.5 w-3.5" /> AI
        </span>
      </div>

      <div ref={scroller} className="h-[340px] overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-3/4 rounded-2xl" />
            <Skeleton className="h-10 w-1/2 rounded-2xl ml-auto" />
            <Skeleton className="h-20 w-4/5 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <motion.div
              animate={reduced ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="h-14 w-14 rounded-3xl gradient-iris flex items-center justify-center glow-iris"
            >
              <Bot className="h-7 w-7 text-white" />
            </motion.div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask me anything about your account, downloads, versions or licensing.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium hover:border-iris/50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={reduced ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-xl gradient-iris flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    m.role === 'user' ? 'gradient-iris text-white' : 'bg-white border border-border'
                  }`}
                >
                  {m.content || <Loader2 className="h-4 w-4 animate-spin text-iris" />}
                </div>
                {m.role === 'user' && (
                  <div className="h-7 w-7 rounded-xl bg-white border border-border flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={retry}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="p-3 border-t border-border/60 flex items-center gap-2 bg-white/60"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          className="bg-white border-border"
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={streaming || !input.trim()} className="gradient-iris text-white shrink-0">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
