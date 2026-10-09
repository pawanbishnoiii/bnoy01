import { createFileRoute } from '@tanstack/react-router';
import CallBooking from '@/screens/CallBooking';
export const Route = createFileRoute('/call')({
  head: () => ({ meta: [
    { title: 'Book a Free Call — Bnoy Studios' },
    { name: 'description', content: 'Book a free call to turn your website, app, automation or Windows software idea into real working software.' },
    { property: 'og:title', content: 'Book a Free Call — Bnoy Studios' },
    { property: 'og:description', content: 'Pick a date and time and tell us your idea. We build web, apps, automation and software.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: CallBooking,
});
