import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Mic, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (v: string) => void;
  suggestions?: string[];
  placeholder?: string;
}

const HISTORY_KEY = 'bnoy_search_history';
const MAX_HISTORY = 5;

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(list: string[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY))); } catch {}
}

/** Glass search bar: debounce upstream, history + autocomplete + voice. */
export default function SearchBar({ value, onChange, suggestions = [], placeholder = 'Search projects, tech, categories…' }: Props) {
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const commit = (v: string) => {
    onChange(v);
    if (v.trim()) {
      const next = [v.trim(), ...history.filter((h) => h !== v.trim())].slice(0, MAX_HISTORY);
      setHistory(next); saveHistory(next);
    }
    setFocused(false);
  };

  const visibleSuggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return Array.from(new Set(suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q))).slice(0, 6);
  }, [suggestions, value]);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice search not supported in this browser.'); return; }
    const r = new SR();
    r.lang = 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    setListening(true);
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; onChange(t); commit(t); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  const showDropdown = focused && (visibleSuggestions.length > 0 || (history.length > 0 && !value.trim()));

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 border border-border bg-white/70 backdrop-blur-xl shadow-card focus-within:border-fire/60 focus-within:ring-2 focus-within:ring-fire/20 transition">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(value); if (e.key === 'Escape') setFocused(false); }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm py-1.5 focus:outline-none placeholder:text-muted-foreground"
          aria-label="Search projects"
        />
        {value && (
          <button onClick={() => onChange('')} aria-label="Clear search" className="p-1.5 rounded-full text-muted-foreground hover:bg-fire/10 hover:text-fire">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={startVoice} aria-label="Voice search"
          className={`p-2 rounded-full transition ${listening ? 'bg-fire text-white animate-pulse' : 'text-muted-foreground hover:bg-fire/10 hover:text-fire'}`}>
          <Mic className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl border border-border bg-white/95 backdrop-blur-xl shadow-card-hover overflow-hidden z-40"
          >
            {visibleSuggestions.length > 0 && (
              <ul className="py-1.5">
                {visibleSuggestions.map((s) => (
                  <li key={s}>
                    <button onClick={() => commit(s)} className="w-full text-left px-4 py-2 text-sm hover:bg-warm-bg flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-ink">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!value.trim() && history.length > 0 && (
              <>
                {visibleSuggestions.length > 0 && <div className="h-px bg-border" />}
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <History className="h-3 w-3" /> Recent
                </div>
                <ul className="pb-1.5">
                  {history.map((h) => (
                    <li key={h} className="flex items-center justify-between pr-2 hover:bg-warm-bg">
                      <button onClick={() => commit(h)} className="flex-1 text-left px-4 py-2 text-sm text-ink">{h}</button>
                      <button onClick={() => { const n = history.filter(x => x !== h); setHistory(n); saveHistory(n); }}
                        className="p-1 text-muted-foreground hover:text-fire" aria-label={`Remove ${h}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
