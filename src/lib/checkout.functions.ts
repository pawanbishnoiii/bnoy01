import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

const itemSchema = z.object({ projectId: z.string().uuid() });
export const prepareCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => itemSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: project, error } = await context.supabase.from('projects').select('id,title,price,discount_price,status').eq('id', data.projectId).eq('status', 'published').single();
  if (error || !project) throw new Error('Project unavailable.');
  const amount = project.discount_price !== null && project.discount_price >= 0 && project.discount_price < project.price ? project.discount_price : project.price;
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: purchase } = await context.supabase.from('purchases').select('id').eq('user_id', context.userId).eq('project_id', project.id).eq('status','completed').maybeSingle();
  if (purchase) return { owned: true, amount, title: project.title };
  if (amount === 0) {
    const { error } = await db.from('purchases').insert({ user_id: context.userId, project_id: project.id, amount: 0, status: 'completed' });
    if (error) throw new Error('Could not unlock this project.');
    return { owned: true, amount: 0, title: project.title };
  }
  const keyId = process.env['RAZORPAY_KEY_ID']; const secret = process.env['RAZORPAY_KEY_SECRET'];
  if (!keyId || !secret) {
    // Demo payment mode until Razorpay keys are configured.
    const demoId = `demo_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    await db.from('checkout_orders').insert({ user_id: context.userId, project_id: project.id, amount, provider_order_id: demoId, status: 'completed' });
    const { error: demoError } = await db.from('purchases').insert({ user_id: context.userId, project_id: project.id, amount, razorpay_payment_id: demoId, status: 'completed' });
    if (demoError && demoError.code !== '23505') throw new Error('Demo payment could not finish.');
    return { owned: true, demo: true, amount, title: project.title };
  }
  const result = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: crypto.randomUUID() }), signal: AbortSignal.timeout(10000) });
  if (!result.ok) throw new Error('Payment service unavailable. No charge was made.');
  const provider = await result.json() as { id: string };
  const { data: order, error: orderError } = await db.from('checkout_orders').insert({ user_id: context.userId, project_id: project.id, amount, provider_order_id: provider.id }).select('id').single();
  if (orderError || !order) throw new Error('Could not create checkout. No charge was made.');
  return { owned: false, amount, title: project.title, orderId: order.id, providerOrderId: provider.id, keyId };
});

export const verifyCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ orderId: z.string().uuid(), paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/), signature: z.string().regex(/^[a-f0-9]{64}$/) }).parse(input)).handler(async ({ data, context }) => {
  const { data: order } = await context.supabase.from('checkout_orders').select('*').eq('id', data.orderId).eq('user_id', context.userId).single();
  if (!order?.provider_order_id) throw new Error('Order unavailable.');
  if (order.status === 'completed') return { success: true };
  const keyId = process.env['RAZORPAY_KEY_ID']; const secret = process.env['RAZORPAY_KEY_SECRET'];
  if (!keyId || !secret) throw new Error('Payment configuration unavailable.');
  const { createHmac, timingSafeEqual } = await import('node:crypto');
  const expected = createHmac('sha256', secret).update(`${order.provider_order_id}|${data.paymentId}`).digest('hex');
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(data.signature))) throw new Error('Payment verification failed.');
  const result = await fetch(`https://api.razorpay.com/v1/payments/${data.paymentId}`, { headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` }, signal: AbortSignal.timeout(10000) });
  if (!result.ok) throw new Error('Payment could not be verified.');
  const payment = await result.json() as { status: string; order_id: string; amount: number; currency: string };
  if (payment.order_id !== order.provider_order_id || payment.status !== 'captured' || payment.amount !== order.amount * 100 || payment.currency !== 'INR') throw new Error('Payment is not yet captured. Please contact support before retrying.');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { error } = await db.from('purchases').insert({ user_id: context.userId, project_id: order.project_id, amount: order.amount, razorpay_payment_id: data.paymentId, status: 'completed' });
  if (error && error.code !== '23505') throw new Error('Payment received; unlock could not finish. Contact support.');
  await db.from('checkout_orders').update({ status: 'completed' }).eq('id', order.id);
  return { success: true };
});