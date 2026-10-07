import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code2, Undo2, Redo2, Eye, Pencil, AlignLeft, AlignCenter, AlignRight, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SafeDescription from '@/components/SafeDescription';

export default function DescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [preview, setPreview] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const editor = useEditor({ immediatelyRender: false, extensions: [StarterKit.configure({ link: { openOnClick: false, protocols: ['https', 'http', 'mailto'] } }), TextAlign.configure({ types: ['heading', 'paragraph'] })],
    content: '', editorProps: { attributes: { class: 'editor-content' } }, onUpdate: ({ editor }) => onChange(editor.getHTML()) });
  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    const html = DOMPurify.sanitize(marked.parse(value || '', { async: false }));
    editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, value]);
  const tools = [
    { name: 'Bold', icon: Bold, active: editor?.isActive('bold'), action: () => editor?.chain().focus().toggleBold().run() },
    { name: 'Italic', icon: Italic, active: editor?.isActive('italic'), action: () => editor?.chain().focus().toggleItalic().run() },
    { name: 'Heading 2', icon: Heading2, active: editor?.isActive('heading', { level: 2 }), action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: 'Heading 3', icon: Heading3, active: editor?.isActive('heading', { level: 3 }), action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { name: 'Bullet list', icon: List, active: editor?.isActive('bulletList'), action: () => editor?.chain().focus().toggleBulletList().run() },
    { name: 'Numbered list', icon: ListOrdered, active: editor?.isActive('orderedList'), action: () => editor?.chain().focus().toggleOrderedList().run() },
    { name: 'Quote', icon: Quote, active: editor?.isActive('blockquote'), action: () => editor?.chain().focus().toggleBlockquote().run() },
    { name: 'Code block', icon: Code2, active: editor?.isActive('codeBlock'), action: () => editor?.chain().focus().toggleCodeBlock().run() },
    ...(['left', 'center', 'right'] as const).map((align, i) => ({ name: `Align ${align}`, icon: [AlignLeft, AlignCenter, AlignRight][i], active: editor?.isActive({ textAlign: align }), action: () => editor?.chain().focus().setTextAlign(align).run() })),
    { name: 'Undo', icon: Undo2, active: false, action: () => editor?.chain().focus().undo().run() },
    { name: 'Redo', icon: Redo2, active: false, action: () => editor?.chain().focus().redo().run() },
  ];
  return <div className="border border-border rounded-lg overflow-hidden bg-background">
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/40">
      {tools.map(tool => <Button key={tool.name} type="button" variant={tool.active ? 'secondary' : 'ghost'} size="icon" className="w-8 h-8" title={tool.name} aria-label={tool.name} disabled={!editor || preview} onClick={tool.action}><tool.icon className="w-4 h-4" /></Button>)}
      <Button type="button" variant="ghost" size="icon" className="w-8 h-8" title="Add link" aria-label="Add link" disabled={preview} onClick={() => setLinkOpen(v => !v)}><Link2 className="w-4 h-4" /></Button>
      <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => setPreview(v => !v)}>{preview ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{preview ? 'Edit' : 'Preview'}</Button>
    </div>
    {linkOpen && <div className="flex gap-2 p-2 border-b border-border"><Input type="url" aria-label="Link URL" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} /><Button type="button" size="sm" disabled={!/^https?:\/\//i.test(url)} onClick={() => { editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); setLinkOpen(false); }}>Apply</Button><Button type="button" size="sm" variant="ghost" onClick={() => { editor?.chain().focus().unsetLink().run(); setLinkOpen(false); }}>Remove</Button></div>}
    {preview ? <div className="p-5 min-h-60"><SafeDescription value={value} /></div> : <EditorContent editor={editor} />}
    <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{editor?.getText().trim().split(/\s+/).filter(Boolean).length || 0} words · {editor?.getText().length || 0} characters</div>
  </div>;
}