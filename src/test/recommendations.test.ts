import { describe, expect, it } from 'vitest';
import { rankRecommendations } from '@/lib/recommendations';
const current = { id:'current',status:'published',category:['SaaS'],tech_stack:['React'],price:100,project_type:'website' };
describe('recommendations', () => {
  it('prioritizes category, technology and budget affinity', () => { const same = { ...current,id:'same' }; const other = { ...current,id:'other',category:['Games'],tech_stack:['Vue'],price:1000 }; expect(rankRecommendations(current,[other,same])[0].id).toBe('same'); });
  it('excludes current, unpublished and duplicate rows', () => expect(rankRecommendations(current,[current,{...current,id:'draft',status:'draft'},{...current,id:'one'},{...current,id:'one'}]).map(x=>x.id)).toEqual(['one']));
  it('keeps software recommendations platform-scoped', () => expect(rankRecommendations({...current,platform:'windows'},[{...current,id:'android',platform:'android'},{...current,id:'windows',platform:'windows'}]).map(x=>x.id)).toEqual(['windows']));
});