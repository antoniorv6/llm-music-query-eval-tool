import { useState } from "react";
import type { Evaluator, UserRole } from "../../../lib/types";
import { createEvaluator, deleteEvaluator, resetEvaluatorKey } from "../../../lib/supabase";

interface Props {
  evaluators: Evaluator[];
  onRefresh: () => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  administrador: {
    label: "Admin",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  evaluador: {
    label: "Evaluador",
    color: "text-teal-400",
    bg: "bg-teal-400/10 border-teal-400/20",
  },
  dual: {
    label: "Dual",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
};

export function TeamManagement({ evaluators, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("evaluador");
  const [creating, setCreating] = useState(false);
  const [newKeyInfo, setNewKeyInfo] = useState<{ key: string; name: string } | null>(null);
  const [resetKeyInfo, setResetKeyInfo] = useState<{ key: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!formName.trim()) return;
    setCreating(true);
    const result = await createEvaluator(formName.trim(), formRole);
    setCreating(false);
    if (result) {
      setNewKeyInfo({ key: result.key, name: formName.trim() });
      setResetKeyInfo(null);
      setFormName("");
      setFormRole("evaluador");
      setShowForm(false);
      onRefresh();
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteEvaluator(id);
    setDeletingId(null);
    setConfirmDelete(null);
    onRefresh();
  }

  async function handleResetKey(id: string) {
    setResettingId(id);
    const key = await resetEvaluatorKey(id);
    setResettingId(null);
    if (key) {
      setResetKeyInfo({ key });
      setNewKeyInfo(null);
    }
  }

  function copyToClipboard(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function KeyBanner({
    keyStr,
    label,
    sublabel,
    accentClass,
  }: {
    keyStr: string;
    label: string;
    sublabel: string;
    accentClass: string;
    onClose: () => void;
  }) {
    return (
      <div className={`mb-4 rounded-lg border p-4 ${accentClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
            />
          </svg>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-surface-200 bg-surface-950/50 rounded px-3 py-2 break-all select-all">
            {keyStr}
          </code>
          <button
            onClick={() => copyToClipboard(keyStr)}
            className="shrink-0 text-xs text-surface-400 hover:text-surface-200 border border-surface-700 hover:border-surface-500 rounded-lg px-3 py-2 transition-colors cursor-pointer"
          >
            {copied ? "✓ Copiada" : "Copiar"}
          </button>
        </div>
        <p className="text-[11px] text-surface-500 mt-2">{sublabel}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Equipo evaluador
          </h3>
          <span className="text-xs text-surface-600 tabular-nums">
            {evaluators.length} miembros
          </span>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400/60 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Añadir
          </button>
        )}
      </div>

      {/* New evaluator key banner */}
      {newKeyInfo && (
        <KeyBanner
          keyStr={newKeyInfo.key}
          label={`Clave generada para ${newKeyInfo.name}`}
          sublabel="Comparte esta clave de forma privada. No podrás verla de nuevo."
          accentClass="bg-emerald-400/5 border-emerald-400/20 text-emerald-400"
          onClose={() => setNewKeyInfo(null)}
        />
      )}

      {/* Reset key banner */}
      {resetKeyInfo && (
        <KeyBanner
          keyStr={resetKeyInfo.key}
          label="Nueva clave generada — la anterior ya no es válida"
          sublabel="Comparte esta clave de forma privada. No podrás verla de nuevo."
          accentClass="bg-violet-400/5 border-violet-400/20 text-violet-400"
          onClose={() => setResetKeyInfo(null)}
        />
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-4 bg-surface-800/50 border border-surface-700 rounded-lg p-4">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">
            Nuevo evaluador
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nombre completo"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              className="flex-1 text-sm bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-surface-200 placeholder-surface-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              className="text-sm bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
            >
              <option value="evaluador">Evaluador</option>
              <option value="administrador">Administrador</option>
              <option value="dual">Dual</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={creating || !formName.trim()}
              className="text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-surface-950 font-semibold rounded-lg px-4 py-2 transition-colors cursor-pointer"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormName("");
              }}
              className="text-sm text-surface-500 hover:text-surface-300 border border-surface-700 rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Evaluators table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700">
              {["Nombre", "Rol", "Acciones"].map((h) => (
                <th
                  key={h}
                  className="py-2 px-3 text-left text-surface-500 font-medium uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {evaluators.map((ev) => {
              const roleConf = ROLE_CONFIG[ev.role] ?? ROLE_CONFIG.evaluador;
              return (
                <tr
                  key={ev.id}
                  className="border-b border-surface-800 hover:bg-surface-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <span className="font-medium text-surface-200">{ev.name}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleConf.color} ${roleConf.bg}`}
                    >
                      {roleConf.label}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleResetKey(ev.id)}
                        disabled={resettingId === ev.id}
                        className="text-[10px] text-surface-500 hover:text-violet-400 transition-colors cursor-pointer uppercase tracking-wider disabled:opacity-40"
                        title="Generar nueva clave de acceso"
                      >
                        {resettingId === ev.id ? "Generando..." : "Reset clave"}
                      </button>
                      <span className="text-surface-700">·</span>
                      {confirmDelete === ev.id ? (
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] text-surface-500">¿Confirmar borrado?</span>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            disabled={deletingId === ev.id}
                            className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer transition-colors font-semibold"
                          >
                            {deletingId === ev.id ? "Borrando..." : "Sí, borrar"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] text-surface-600 hover:text-surface-400 cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(ev.id)}
                          className="text-[10px] text-surface-500 hover:text-rose-400 transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
