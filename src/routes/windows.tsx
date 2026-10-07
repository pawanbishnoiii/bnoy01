import { createFileRoute } from '@tanstack/react-router';
import AppsPage from '@/screens/Apps';
export const Route = createFileRoute('/windows')({
  head: () => ({ meta: [
    { title: 'Windows Software Marketplace — Bnoy Studios' },
    { name: 'description', content: 'Browse Windows software, installers, system requirements and release notes from Bnoy Studios.' },
    { property: 'og:title', content: 'Windows Software Marketplace — Bnoy Studios' },
    { property: 'og:description', content: 'Browse Windows software, installers, system requirements and release notes from Bnoy Studios.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AppsPage platform="windows" />,
});