import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import styles from './BlogEditor.module.css';

interface BlogEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * TipTap rich-text editor for authoring blog posts. The HTML it produces
 * is passed to the server and run through `App\Services\HtmlSanitizer`
 * before anything is stored — so the set of tags the toolbar exposes
 * roughly matches the sanitiser's allowlist (h2/h3/h4, p, lists, links,
 * code, blockquote, image).
 *
 * We deliberately do NOT trust the editor's output client-side. A hostile
 * pasted fragment could arrive here; the server strips it either way.
 */
export function BlogEditor({ value, onChange }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // StarterKit's bundled link has autolink quirks that conflict with
        // our custom Link config; swap it out.
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow ugc',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'blog-editor-image',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing…',
      }),
    ],
    content: value,
    // React 18's StrictMode double-renders. TipTap's own guidance is to
    // set immediatelyRender:false when used inside SSR / strict dev modes
    // so hydration mismatches don't fire.
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.content,
        // Critical: the content region needs a stable role for assistive
        // tech; TipTap sets contenteditable but not a label.
        'aria-label': 'Blog post body',
      },
    },
  });

  // Keep the editor in sync if the parent replaces `value` from the outside
  // (e.g. after a successful save). We don't overwrite on every keystroke
  // — only when the underlying value actually differs from the editor's
  // current HTML, to avoid cursor thrash.
  const lastValue = useRef(value);
  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value !== lastValue.current && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      lastValue.current = value;
    }
  }, [value, editor]);

  if (!editor) {
    return <div className={styles.loading}>Loading editor…</div>;
  }

  function promptLink() {
    if (!editor) {
      return;
    }

    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL (http/https/mailto only)', prev ?? 'https://');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Client-side URL check mirrors the sanitiser's allowlist. Anything
    // else gets rejected silently so it never ships.
    const safe = /^(https?:|mailto:)/i.test(url);
    if (!safe) {
      window.alert('Link must be http(s) or mailto.');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }

  function promptImage() {
    if (!editor) {
      return;
    }

    const url = window.prompt('Image URL', 'https://');
    if (!url) {
      return;
    }

    // Same URL safety check as for links — the sanitiser would drop it
    // anyway, but rejecting here avoids saving garbage.
    if (!/^https?:/i.test(url)) {
      window.alert('Image URL must be http(s).');
      return;
    }

    const alt = window.prompt('Alt text (describe the image briefly)', '') ?? '';
    editor.chain().focus().setImage({ src: url, alt }).run();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar} role="toolbar" aria-label="Text formatting">
        <ToolbarGroup>
          <ToolbarButton
            label="H2"
            title="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            label="H3"
            title="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <ToolbarButton
            label="H4"
            title="Heading 4"
            active={editor.isActive('heading', { level: 4 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup>
          <ToolbarButton
            label="B"
            title="Bold"
            active={editor.isActive('bold')}
            style={{ fontWeight: 700 }}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="I"
            title="Italic"
            active={editor.isActive('italic')}
            style={{ fontStyle: 'italic' }}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="S"
            title="Strikethrough"
            active={editor.isActive('strike')}
            style={{ textDecoration: 'line-through' }}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            label="</>"
            title="Inline code"
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup>
          <ToolbarButton
            label="• List"
            title="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="1. List"
            title="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label="Quote"
            title="Blockquote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            label="Code block"
            title="Code block"
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup>
          <ToolbarButton
            label="Link"
            title="Insert or edit link"
            active={editor.isActive('link')}
            onClick={promptLink}
          />
          <ToolbarButton
            label="Image"
            title="Insert image by URL"
            active={false}
            onClick={promptImage}
          />
          <ToolbarButton
            label="HR"
            title="Horizontal rule"
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup>
          <ToolbarButton
            label="Undo"
            title="Undo"
            active={false}
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          />
          <ToolbarButton
            label="Redo"
            title="Redo"
            active={false}
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          />
        </ToolbarGroup>
      </div>

      <EditorContent editor={editor} className={styles.editor} />
    </div>
  );
}

/* ---------------------------- toolbar helpers --------------------------- */

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}

function ToolbarDivider() {
  return <span className={styles.divider} aria-hidden="true" />;
}

interface ToolbarButtonProps {
  label: string;
  title: string;
  active: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick: () => void;
}

function ToolbarButton({
  label,
  title,
  active,
  disabled,
  style,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={styles.toolBtn}
      data-active={active}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      style={style}
    >
      {label}
    </button>
  );
}
