type Product = { id: string; status: string; category?: string[] | null; tech_stack?: string[] | null; project_type?: string | null; platform?: string | null; price?: number | null; discount_price?: number | null; created_at?: string | null; views_count?: number | null; likes_count?: number | null; download_count?: number | null };
const overlap = (a?: string[] | null, b?: string[] | null) => { const set = new Set((a || []).map(s => s.toLowerCase())); return new Set((b || []).map(s => s.toLowerCase()).filter(s => set.has(s))).size; };
export function rankRecommendations<T extends Product>(current: Product, candidates: T[], limit = 6, now = Date.now()): T[] {
  const seen = new Set<string>();
  const score = (p: Product) => {
    const a = current.discount_price ?? current.price ?? 0; const b = p.discount_price ?? p.price ?? 0;
    const price = a === 0 ? (b === 0 ? 2 : 0) : 2 * (1 - Math.min(Math.abs(a-b) / Math.max(a,b,1),1));
    const age = Math.max(0,(now - Date.parse(p.created_at || '')) / 86400000);
    return overlap(current.category,p.category)*5 + Math.min(overlap(current.tech_stack,p.tech_stack),4)*2 + (current.project_type && current.project_type === p.project_type ? 3 : 0) + price + (Number.isFinite(age) ? 1/(1+age/90) : 0) + Math.min(Math.log1p(Math.max(0,(p.views_count || p.download_count || 0)+(p.likes_count || 0)*5))/8,1);
  };
  return candidates.filter(p => { if (p.id === current.id || p.status !== 'published' || seen.has(p.id) || (current.platform && p.platform !== current.platform)) return false; seen.add(p.id); return true; }).map(p => ({ p, score:score(p) })).sort((a,b) => b.score-a.score || a.p.id.localeCompare(b.p.id)).slice(0,limit).map(x => x.p);
}