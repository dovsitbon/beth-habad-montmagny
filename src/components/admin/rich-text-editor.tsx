"use client";

import { useId, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextBIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";

/**
 * Éditeur de texte très simple (gras, italique, titre, listes, citation, lien).
 * Le HTML produit est placé dans un champ caché `name`, puis nettoyé côté serveur.
 */
export function RichTextEditor({
  name,
  label,
  defaultValue = "",
  hint,
  error,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": `${id}-label`,
        class: "rich-text min-h-40 px-3 py-3 outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
      quote: e?.isActive("blockquote") ?? false,
      link: e?.isActive("link") ?? false,
    }),
  });

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresse du lien (laisser vide pour retirer le lien) :", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
  };

  const tools = [
    { label: "Gras", Icon: TextBIcon, on: active?.bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Italique", Icon: TextItalicIcon, on: active?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Intertitre", Icon: TextHTwoIcon, on: active?.h2, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Liste à puces", Icon: ListBulletsIcon, on: active?.bullet, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Liste numérotée", Icon: ListNumbersIcon, on: active?.ordered, run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Citation", Icon: QuotesIcon, on: active?.quote, run: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: "Lien", Icon: LinkSimpleIcon, on: active?.link, run: setLink },
  ];

  return (
    <div>
      <p id={`${id}-label`} className="font-semibold text-ink">
        {label}
      </p>
      {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
      <div
        className={`mt-1.5 overflow-hidden rounded-md border bg-surface focus-within:border-night focus-within:ring-2 focus-within:ring-gold/60 ${error ? "border-red-700" : "border-line"}`}
      >
        <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap gap-1 border-b border-line bg-canvas p-1">
          {tools.map(({ label: toolLabel, Icon, on, run }) => (
            <button
              key={toolLabel}
              type="button"
              onClick={run}
              aria-pressed={on}
              title={toolLabel}
              className="inline-flex size-11 items-center justify-center rounded text-ink hover:bg-night-tint aria-pressed:bg-night aria-pressed:text-white"
            >
              <Icon aria-hidden weight="bold" className="size-5" />
              <span className="sr-only">{toolLabel}</span>
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && <p className="mt-1 text-sm font-semibold text-red-800">{error}</p>}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
