import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CommentFieldProps {
  comment: string;
  onChange: (comment: string) => void;
}

export function CommentField({ comment, onChange }: CommentFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment);

  function handleSave() {
    onChange(draft.trim());
    setEditing(false);
  }

  function handleCancel() {
    setDraft(comment);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
    if (e.key === "Escape") handleCancel();
  }

  // Sync draft when the persisted comment changes (e.g. after save from parent)
  if (!editing && draft !== comment) {
    setDraft(comment);
  }

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una nota sobre esta respuesta..."
            rows={3}
            autoFocus
            className="w-full px-3 py-2.5 bg-surface-850 border border-surface-700 rounded-lg text-surface-200 text-[13px] leading-relaxed placeholder-surface-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15 resize-none"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 text-[12px] font-medium rounded-md cursor-pointer transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 text-surface-500 hover:text-surface-300 text-[12px] cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <span className="ml-auto text-[11px] text-surface-600">⌘↵ para guardar</span>
          </div>
        </motion.div>
      ) : comment ? (
        <motion.div
          key="display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="group flex items-start gap-2"
        >
          <svg className="w-3 h-3 text-surface-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <p className="flex-1 text-[12px] text-surface-500 leading-relaxed line-clamp-3">
            {comment}
          </p>
          <button
            onClick={() => setEditing(true)}
            title="Editar nota"
            className="shrink-0 p-1 text-surface-600 hover:text-surface-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="add"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-[11px] text-surface-600 hover:text-surface-400 transition-colors cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir nota
        </motion.button>
      )}
    </AnimatePresence>
  );
}
