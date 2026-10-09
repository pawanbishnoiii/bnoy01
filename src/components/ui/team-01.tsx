import { Badge } from '@/components/ui/badge';
import { Globe, Instagram, Github, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import m1 from '@/assets/team/member-1.asset.json';
import m2 from '@/assets/team/member-2.asset.json';
import m3 from '@/assets/team/member-3.asset.json';
import m4 from '@/assets/team/member-4.asset.json';

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.633 13.633h-2.37V9.92c0-.885-.017-2.025-1.234-2.025-1.235 0-1.424.965-1.424 1.96v3.778h-2.37V5.998H8.51v1.043h.031a2.5 2.5 0 0 1 2.246-1.233c2.403 0 2.846 1.58 2.846 3.637zM3.56 4.954a1.376 1.376 0 1 1 0-2.751 1.376 1.376 0 0 1 0 2.751m1.185 8.679H2.372V5.998h2.373zM14.815.001H1.18A1.17 1.17 0 0 0 0 1.154v13.691A1.17 1.17 0 0 0 1.18 16h13.635A1.17 1.17 0 0 0 16 14.845V1.153A1.17 1.17 0 0 0 14.815 0" fill="currentColor" />
  </svg>
);

const defaultImages = [m1.url, m2.url, m3.url, m4.url];
type Member = { id: string; name: string; expertise: string; image_url: string | null; website_url: string | null; linkedin_url: string | null; instagram_url: string | null; github_url: string | null; x_url: string | null };
const fallback: Member[] = [
  ['Logan Dang', 'WordPress Developer'], ['Ana Belić', 'Social Media Specialist'], ['Brian Hanley', 'Product Designer'], ['Darko Stanković', 'UI Designer'],
].map(([name, expertise], i) => ({ id: `default-${i}`, name, expertise, image_url: defaultImages[i], website_url: null, linkedin_url: null, instagram_url: null, github_url: null, x_url: null }));

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const Team = () => {
  const { data } = useQuery({
    queryKey: ['public-team'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('id,name,expertise,image_url,website_url,linkedin_url,instagram_url,github_url,x_url').eq('published', true).order('sort_order');
      if (error) throw error;
      return (data || []) as Member[];
    },
  });
  const members = data && data.length ? data : fallback;
  return (
    <section id="team">
      <div className="lg:py-20 sm:py-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16 flex flex-col items-center justify-center gap-8 md:gap-16">
          <motion.div initial={{ y: -40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease }} className="max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-4">
            <Badge variant="outline" className="px-3 py-1 h-auto text-sm">Team</Badge>
            <h2 className="text-3xl md:text-5xl font-medium text-foreground">Meet the creative minds behind our success</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((value, index) => {
              const links = [[value.website_url, Globe, 'Website'], [value.linkedin_url, null, 'LinkedIn'], [value.instagram_url, Instagram, 'Instagram'], [value.github_url, Github, 'GitHub'], [value.x_url, Twitter, 'X']] as const;
              return (
                <motion.div key={value.id} initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: index * 0.1, ease }} className="group flex flex-col items-center justify-center gap-6">
                  <img className="w-full h-full group-hover:grayscale transition-all duration-300" src={value.image_url || defaultImages[index % 4]} alt={value.name} loading="lazy" />
                  <div className="w-full flex flex-col gap-4 items-center justify-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h3 className="text-2xl font-medium text-foreground">{value.name}</h3>
                      <p className="text-sm font-normal text-muted-foreground">{value.expertise}</p>
                    </div>
                    <div className="flex gap-2">
                      {links.map(([url, Icon, label]) => {
                        const show = /^https?:\/\//i.test(url || '') || (value.id.startsWith('default-') && (label === 'Website' || label === 'LinkedIn'));
                        if (!show) return null;
                        return <a key={label} href={url || '#'} aria-label={`${value.name} ${label}`} className="p-2 hover:bg-accent/80 rounded-full" target="_blank" rel="noopener noreferrer">{Icon ? <Icon size={16} /> : <LinkedinIcon size={16} />}</a>;
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
