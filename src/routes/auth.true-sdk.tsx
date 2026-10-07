import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/auth/true-sdk')({
  head: () => ({ meta: [
    { title: 'Truecaller Sign-in — Bnoy Studios' },
    { name: 'description', content: 'Truecaller sign-in status for Bnoy Studios.' },
    { property: 'og:title', content: 'Truecaller Sign-in — Bnoy Studios' },
    { property: 'og:description', content: 'Truecaller sign-in status for Bnoy Studios.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <main className="min-h-screen grid place-items-center bg-background px-6"><div className="max-w-sm text-center space-y-5"><ShieldAlert className="h-10 w-10 text-primary mx-auto" /><h1 className="text-2xl font-semibold">Truecaller sign-in unavailable</h1><p className="text-muted-foreground">Verification is not connected yet. Please use another sign-in method.</p><Button asChild><Link to="/login">Back to sign in</Link></Button></div></main>,
});