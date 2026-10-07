import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { parseUserAgent } from '@/lib/user-agent';
import { z } from 'zod';
export const recordLogin = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator(input=>z.object({screen:z.string().max(40)}).parse(input)).handler(async ({data,context})=>{
  const request=getRequest();
  const { data:{user} }=await context.supabase.auth.getUser(); if(!user) throw new Error('Sign in required.');
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'') || '';
  let sessionKey=''; try { const jwt=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));sessionKey=jwt.session_id; } catch { return {suspicious:false}; }
  if (!sessionKey) return {suspicious:false};
  const { supabaseAdmin:db }=await import('@/integrations/supabase/client.server');
  await db.from('profiles').upsert({id:context.userId,email:user.email_confirmed_at && user.email && !user.email.endsWith('@phone.bnoy.invalid') ? user.email.toLowerCase():null,email_verified:!!user.email_confirmed_at && !user.email?.endsWith('@phone.bnoy.invalid')});
  const {data:exists}=await db.from('user_login_logs').select('id').eq('user_id',context.userId).eq('session_key',sessionKey).maybeSingle();if(exists)return {suspicious:false};
  const ip=request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
  let geo: Record<string,any>={};
  if(ip && ip!=='127.0.0.1' && ip!=='::1')try{ const r=await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`,{signal:AbortSignal.timeout(2500)});const j=await r.json();if(j.success)geo=j;}catch{}
  const parsed=parseUserAgent(request.headers.get('user-agent') || '');
  const {data:prev}=await db.from('user_login_logs').select('country').eq('user_id',context.userId).order('login_at',{ascending:false}).limit(1).maybeSingle();
  const suspicious=!!(prev?.country && geo.country && prev.country!==geo.country);
  const method=user.user_metadata?.provider==='truecaller' ? 'truecaller': user.app_metadata?.provider || 'email';
  const {error}=await db.from('user_login_logs').insert({user_id:context.userId,session_key:sessionKey,login_method:method,ip_address:ip,country:geo.country || null,state:geo.region || null,city:geo.city || null,timezone:geo.timezone?.id || null,isp:geo.connection?.isp || null,device_type:parsed.deviceType,device_name:parsed.deviceName,browser:parsed.browser,os:parsed.os,screen_size:data.screen,is_suspicious:suspicious});
  if(error && error.code!=='23505')throw new Error('Login history could not be saved.');
  return {suspicious,city:geo.city as string|undefined,country:geo.country as string|undefined};
});