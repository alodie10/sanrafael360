"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  ImagePlus,
  Loader2,
  Undo2,
  Redo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  "data-testid"?: string;
};

async function uploadImageToCloudinary(file: File): Promise<string> {
  const signRes = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "sanrafael360_avisos" }),
  });
  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok) {
    throw new Error(signData.error || "No se pudo firmar la subida");
  }

  const { signature, timestamp, api_key, cloud_name, folder } = signData;
  if (!signature || !api_key || !cloud_name) {
    throw new Error("Firma Cloudinary incompleta");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: "POST", body: formData }
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.secure_url) {
    throw new Error(uploadData.error?.message || "Error al subir imagen");
  }
  return uploadData.secure_url as string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors disabled:opacity-40 ${
        active
          ? "border-primary/40 bg-primary/20 text-primary"
          : "border-white/10 bg-black/30 text-zinc-300 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function ClienteMailEditor({ value, onChange, "data-testid": testId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const applyingExternal = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          style: "max-width:100%;height:auto;border-radius:8px;",
        },
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] max-h-[420px] overflow-y-auto px-4 py-3 text-sm text-white focus:outline-none prose prose-invert prose-sm max-w-none [&_a]:text-primary [&_img]:my-2",
        ...(testId ? { "data-testid": testId } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (applyingExternal.current) return;
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      applyingExternal.current = true;
      editor.commands.setContent(value, { emitUpdate: false });
      applyingExternal.current = false;
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace (https://…)", previous || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }, [editor]);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo imágenes (JPG, PNG, WebP…)");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageToCloudinary(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  if (!editor) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-8 text-zinc-500 text-sm flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando editor…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <ToolbarButton
          title="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Cursiva"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Lista"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Enlace" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Insertar imagen (Cloudinary)"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton title="Deshacer" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Rehacer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickImage}
        />
      </div>
      <EditorContent editor={editor} />
      {error && <p className="px-4 py-2 text-xs text-red-300 border-t border-red-500/20">{error}</p>}
      <p className="px-4 py-2 text-[10px] text-zinc-500 border-t border-white/5">
        Links e imágenes via Cloudinary (HTTPS). No son adjuntos MIME.
      </p>
    </div>
  );
}
