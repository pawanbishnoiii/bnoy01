import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export default function SafeDescription({ value }: { value: string }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    const parsed = marked.parse(value || '', { async: false });
    setHtml(DOMPurify.sanitize(parsed, { USE_PROFILES: { html: true } }));
  }, [value]);
  return html ? <div className="description-content prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>;
}