import { useEffect, useState } from 'react';
import { useParams } from '@/lib/router';
import { supabase } from '@/integrations/supabase/client';
import NotFound from './NotFound';

const GOOGLE_FILE = /^google[a-z0-9]+\.html$/i;

/**
 * Serves the Google Search Console HTML verification file stored by an admin.
 * Route: /:file — only responds for `googleXXXX.html` paths, otherwise 404.
 */
export default function GoogleVerify() {
  const { file } = useParams();
  const [state, setState] = useState<'loading' | 'ok' | 'miss'>('loading');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!file || !GOOGLE_FILE.test(file)) { setState('miss'); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      if (cancelled) return;
      const name = (data as any)?.google_verify_file_name as string | undefined;
      const body = (data as any)?.google_verify_file_content as string | undefined;
      if (name && body && name.toLowerCase() === file.toLowerCase()) {
        setContent(body);
        setState('ok');
      } else {
        setState('miss');
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  if (state === 'miss') return <NotFound />;
  if (state === 'loading') return <pre style={{ fontFamily: 'monospace', padding: 16 }} />;
  return <pre style={{ fontFamily: 'monospace', padding: 16, margin: 0, whiteSpace: 'pre-wrap' }}>{content}</pre>;
}
