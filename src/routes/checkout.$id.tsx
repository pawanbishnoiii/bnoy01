import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { prepareCheckout, verifyCheckout } from '@/lib/checkout.functions';
import { useToast } from '@/hooks/use-toast';

export const Route = createFileRoute('/checkout/$id')({ head: () => ({ meta: [
  { title: 'Project Checkout — Bnoy Studios' }, { name: 'description', content: 'Review your Bnoy Studios source code order.' },
  { property: 'og:title', content: 'Project Checkout — Bnoy Studios' }, { property: 'og:description', content: 'Review your Bnoy Studios source code order.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
] }), component: Checkout });
function Checkout() {
  const { id } = Route.useParams(); const { user, setShowAuthModal } = useAuthStore(); const { toast } = useToast();
  const [busy, setBusy] = useState(false); const [complete, setComplete] = useState(false);
  const { data: project, isLoading, error } = useQuery({ queryKey: ['checkout-project', id], queryFn: async () => {
    const { data, error } = await supabase.from('projects').select('id,title,short_desc,price,discount_price,thumbnail_url,slug').eq('id',id).eq('status','published').single(); if (error) throw error; return data;
  } });
  const pay = async () => {
    setBusy(true);
    try {
      const order = await prepareCheckout({ data: { projectId: id } });
      if (order.owned) { if ('demo' in order && order.demo) toast({ title: 'Demo payment successful', description: 'Test mode — no real money charged.' }); setComplete(true); return; }
      if (!order.keyId || !order.providerOrderId || !order.orderId) throw new Error('Order unavailable.');
      if (!window.Razorpay) await new Promise<void>((resolve,reject) => { const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=()=>resolve();s.onerror=()=>reject(new Error('Payment service could not load.'));document.body.appendChild(s); });
      const localOrderId = order.orderId;
      const payment = new window.Razorpay({ key: order.keyId, order_id: order.providerOrderId, amount: order.amount*100, currency:'INR', name:'Bnoy Studios', description:order.title, prefill:{email:user?.email?.endsWith('@phone.bnoy.invalid') ? '' : user?.email || '',contact:user?.phone || ''}, handler:async (r: { razorpay_payment_id: string; razorpay_signature: string }) => {
        try { await verifyCheckout({ data:{orderId:localOrderId,paymentId:r.razorpay_payment_id,signature:r.razorpay_signature} });setComplete(true); } catch (err) { toast({title:'Payment verification pending',description:err instanceof Error ? err.message:'Please contact support.',variant:'destructive'}); }
      }}); payment.open();
    } catch(err) { toast({title:'Checkout unavailable',description:err instanceof Error ? err.message:'Please retry.',variant:'destructive'}); } finally { setBusy(false); }
  };
  const amount = project?.discount_price != null && project.discount_price < project.price ? project.discount_price : project?.price;
  return <div className="min-h-screen bg-background"><Navbar/><AuthModal/><main className="max-w-4xl mx-auto px-5 pt-28 pb-16"><Link to="/marketplace" className="inline-flex items-center gap-2 text-muted-foreground mb-8"><ArrowLeft className="h-4 w-4"/>Marketplace</Link><h1 className="text-3xl font-bold mb-8">Checkout</h1>{isLoading ? <p>Loading your order…</p> : error || !project ? <p role="alert">This project is unavailable.</p> : complete ? <div className="space-y-5"><ShieldCheck className="h-10 w-10 text-primary"/><h2 className="text-2xl font-semibold">Your project is unlocked</h2><Button asChild><Link to="/dashboard">Your downloads</Link></Button></div> : <div className="grid md:grid-cols-[1fr_280px] gap-8"><div className="space-y-4">{project.thumbnail_url && <img src={project.thumbnail_url} alt={project.title} className="w-full aspect-video object-cover rounded-lg"/>}<h2 className="text-2xl font-semibold">{project.title}</h2><p className="text-muted-foreground">{project.short_desc}</p></div><aside className="space-y-5 border-t md:border-t-0 md:border-l border-border pt-5 md:pt-0 md:pl-8"><h2 className="font-semibold">Order summary</h2><div className="flex justify-between text-sm"><span>Source code</span><span>₹{amount}</span></div><div className="flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span>₹{amount}</span></div>{user ? <Button className="w-full" disabled={busy} onClick={pay}>{busy?'Please wait…':amount===0?'Unlock free project':'Pay ₹'+amount+' (demo)'}</Button> : <Button className="w-full" onClick={()=>setShowAuthModal(true,'Sign in to complete checkout.')}><Lock className="h-4 w-4"/>Sign in</Button>}<p className="text-xs text-muted-foreground flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0"/>Demo payment mode — no real charge. Razorpay will be enabled soon.</p></aside></div>}</main></div>;
}