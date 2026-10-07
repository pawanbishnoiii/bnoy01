import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startTruecaller } from '@/lib/truecaller.functions';
import { useToast } from '@/hooks/use-toast';
export default function TruecallerButton({ link = false }: { link?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate(); const { toast } = useToast();
  useEffect(() => setSupported(/Android/i.test(navigator.userAgent)), []);
  if (!supported) return null;
  return <Button type="button" variant="outline" disabled={busy} className="w-full" onClick={async () => {
    setBusy(true);
    try {
      const attempt = await startTruecaller();
      sessionStorage.setItem('bnoy_truecaller', JSON.stringify({ requestId: attempt.requestId, proof: attempt.proof }));
      window.location.href = attempt.deepLink;
      navigate('/auth/true-sdk');
    } catch (err) { toast({ title: 'Truecaller unavailable', description: err instanceof Error ? err.message : 'Try another method.', variant: 'destructive' }); }
    finally { setBusy(false); }
  }}><Phone className="h-4 w-4" />{link ? 'Verify phone with Truecaller' : 'Continue with Truecaller'}</Button>;
}