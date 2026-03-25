import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CommentFieldProps {
  comment: string;
  onChange: (comment: string) => void;
}

export function CommentField({ comment, onChange }: CommentFieldProps) {
  const [expanded, setExpanded] = useState(comment.length > 0);
  const [draft, setDraft] = useState(comment);

  function handleSave() {
    onChange(draft);
    if (!draft.trim()) setExpanded(false);
  }

  function handleCancel() {
    setDraft(comment);
    setExpanded(false);
  }

  return (
    <AnimatePresence mode="wait">
      {!expanded ? (
        <motion.button
          key="add-btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExpanded(true)}
          className="text-xs text-accent-400/50 hover:text-accent-400/80 transition-colors cursor-pointer font-medium"
        >
          + Agregar comentario
        </motion.button>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-2 overflow-hidden"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Comentario opcional..."
            rows={2}
            className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-md text-surface-200 text-sm placeholder-surface-600 focus:outline-none focus:border-accent-500/40 focus:ring-1 focus:ring-accent-500/15 resize-y min-h-[56px]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded cursor-pointer transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-surface-850 hover:bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 text-xs font-medium rounded cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
