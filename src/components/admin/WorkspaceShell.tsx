import { useState, type ReactNode, type ElementType } from 'react';
import { Link } from '@tanstack/react-router';
import { PanelLeftClose, PanelLeftOpen, Menu, X, ArrowUpRight, Search, LogOut, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FullscreenButton from './FullscreenButton';
import { supabase } from '@/integrations/supabase/client';
import bnoyLogo from '@/assets/bnoy-logo.png';

type Item = { id: string; label: string; icon: ElementType };
const groups = [
  { title: 'Overview', ids: ['dashboard', 'analytics'] },
  { title: 'Catalog & Studio', ids: ['editor', 'projects', 'add', 'apps', 'categories'] },
  { title: 'Media', ids: ['media-cloud'] },
  { title: 'Customers', ids: ['orders', 'users', 'emails', 'notifications'] },
  { title: 'Security & Analytics', ids: ['login-security', 'visitors', 'truecaller'] },
  { title: 'Website & Settings', ids: ['team', 'google', 'ai-deploy', 'settings'] },
];

export default function WorkspaceShell({ items, active, onSelect, children }: { items: Item[]; active: string; onSelect: (id: string) => void; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = items.find(i => i.id === active);
  const navigate = (id: string) => { onSelect(id); setMobileOpen(false); };
  return <div className="workspace-shell min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open workspace menu" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
        <img src={bnoyLogo} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0"><p className="truncate font-display font-bold">Bnoy Studios</p><p className="text-xs text-muted-foreground">Studio workspace</p></div>
        <span className="hidden border-l border-border pl-4 text-sm text-muted-foreground sm:block">{selected?.label}</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <FullscreenButton />
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/">View website <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
        <Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-foreground/30 md:hidden" onClick={() => setMobileOpen(false)} />}
    <div className="flex">
      <aside className={`workspace-sidebar fixed bottom-0 top-16 z-50 flex flex-col border-r border-border bg-card transition-[width,transform] duration-200 ${collapsed ? 'md:w-20' : 'md:w-64'} w-72 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          {!collapsed && <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search workspace pages" placeholder="Find a page" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>}
          <Button variant="ghost" size="icon" className="hidden shrink-0 md:inline-flex" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Close workspace menu" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></Button>
        </div>
        <nav aria-label="Workspace" className="flex-1 space-y-5 overflow-y-auto p-3">
          {groups.map(group => { const visible = items.filter(i => group.ids.includes(i.id) && i.label.toLowerCase().includes(search.toLowerCase())); if (!visible.length) return null; return <div key={group.title} className="space-y-1">
            {!collapsed && <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">{group.title}</p>}
            {visible.map(item => <Button key={item.id} variant="ghost" title={item.label} aria-label={item.label} aria-current={active === item.id ? 'page' : undefined} onClick={() => navigate(item.id)} className={`h-10 w-full gap-3 ${collapsed ? 'justify-center px-0' : 'justify-start px-3'} ${active === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}><item.icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="truncate">{item.label}</span>}</Button>)}
          </div>; })}
          {search && !items.some(i => i.label.toLowerCase().includes(search.toLowerCase())) && <p className="p-3 text-sm text-muted-foreground">No matching pages.</p>}
        </nav>
      </aside>
      <main className={`min-w-0 flex-1 p-4 sm:p-6 lg:p-8 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>{children}</main>
    </div>
  </div>;
}