import { motion } from 'framer-motion';
import { Globe, Linkedin, Instagram, Github, Twitter, UserRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export default function Team01() {
  const { data: members = [] } = useQuery({
    queryKey: ['public-team'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('id,name,expertise,image_url,website_url,linkedin_url,instagram_url,github_url,x_url').eq('published', true).order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });
  return <section id="team" className="py-16 md:py-20 bg-background">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16">
      <div className="mx-auto mb-8 md:mb-12 max-w-2xl text-center space-y-4">
        <Badge variant="outline">Team</Badge>
        <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-medium text-foreground">Creative Team Showcase</h2>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {members.map((member, index) => <motion.article key={member.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .06 }} className="group text-center min-w-0">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
            {member.image_url ? <img src={member.image_url} alt={member.name} loading="lazy" className="w-full h-full object-cover transition duration-300 group-hover:grayscale" /> : <UserRound className="h-full w-1/2 mx-auto text-muted-foreground" />}
          </div>
          <h3 className="mt-2 md:mt-5 text-[11px] leading-tight sm:text-lg lg:text-2xl font-medium break-words">{member.name}</h3>
          <p className="mt-1 md:mt-2 text-[9px] leading-tight sm:text-xs lg:text-sm text-muted-foreground break-words">{member.expertise}</p>
          <div className="mt-1 md:mt-3 flex flex-wrap justify-center gap-0 md:gap-2">
            {[[member.website_url, Globe, 'Website'], [member.linkedin_url, Linkedin, 'LinkedIn'], [member.instagram_url, Instagram, 'Instagram'], [member.github_url, Github, 'GitHub'], [member.x_url, Twitter, 'X']].map(([url, Icon, label]) => {
              const href = String(url || '');
              if (!/^https?:\/\//i.test(href) || typeof Icon === 'string') return null;
              return <a key={String(label)} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} ${label}`} title={String(label)} className="p-1 md:p-2 rounded-full hover:bg-accent text-foreground"><Icon className="h-3 w-3 md:h-4 md:w-4" /></a>;
            })}
          </div>
        </motion.article>)}
      </div>
    </div>
  </section>;
}