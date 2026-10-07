import { createFileRoute } from '@tanstack/react-router';
import { truecallerCallback } from '@/lib/truecaller-callback';
export const Route = createFileRoute('/api/public/truecaller')({ server: { handlers: { POST: ({ request }) => truecallerCallback(request) } } });