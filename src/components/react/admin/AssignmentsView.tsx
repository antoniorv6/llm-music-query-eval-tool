import { useState, useMemo } from "react";
import type { ResponsesData } from "../../../lib/types";
import { assignImage, unassignImage } from "../../../lib/supabase";

interface Assignment {
  image_filename: string;
  evaluator_id: string;
  evaluator_name: string;
}

interface SimpleEvaluator {
  id: string;
  name: string;
  role: string;
}

interface Props {
  responsesData: ResponsesData;
  assignments: Assignment[];
  evaluators: SimpleEvaluator[];
  onRefresh: () => void;
}

type FilterMode = "all" | "assigned" | "unassigned";

export function AssignmentsView({ responsesData, assignments, evaluators, onRefresh }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  // Per-image: which evaluator is selected in the "add" dropdown
  const [addSelections, setAddSelections] = useState<Record<string, string>>({});

  // Map: image_filename → list of assigned evaluators
  const assignmentMap = useMemo(() => {
    const map = new Map<string, { evaluator_id: string; evaluator_name: string }[]>();
    for (const a of assignments) {
      const existing = map.get(a.image_filename) ?? [];
      existing.push({ evaluator_id: a.evaluator_id, evaluator_name: a.evaluator_name });
      map.set(a.image_filename, existing);
    }
    return map;
  }, [assignments]);

  const allImages = useMemo(
    () => Object.keys(responsesData).sort(),
    [responsesData]
  );

  const filteredImages = useMemo(() => {
    if (filter === "assigned") return allImages.filter((img) => assignmentMap.has(img));
    if (filter === "unassigned") return allImages.filter((img) => !assignmentMap.has(img));
    return allImages;
  }, [allImages, assignmentMap, filter]);

  const stats = useMemo(
    () => ({
      total: allImages.length,
      assigned: allImages.filter((img) => assignmentMap.has(img)).length,
    }),
    [allImages, assignmentMap]
  );

  // Only evaluadores and duales can be assigned images (not pure administradores)
  const assignable = evaluators.filter((e) => e.role !== "administrador");

  async function handleAdd(imageFilename: string) {
    const evaluatorId = addSelections[imageFilename];
    if (!evaluatorId) return;
    setSaving(imageFilename);
    await assignImage(imageFilename, evaluatorId);
    setAddSelections((prev) => ({ ...prev, [imageFilename]: "" }));
    setSaving(null);
    onRefresh();
  }

  async function handleRemove(imageFilename: string, evaluatorId: string) {
    setSaving(`${imageFilename}:${evaluatorId}`);
    await unassignImage(imageFilename, evaluatorId);
    setSaving(null);
    onRefresh();
  }

  const filterLabels: Record<FilterMode, string> = {
    all: "Todas",
    assigned: "Asignadas",
    unassigned: "Sin asignar",
  };

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Asignaciones de imágenes
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats chip */}
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <span className="tabular-nums font-semibold text-teal-400">{stats.assigned}</span>
            <span>/ {stats.total} asignadas</span>
            {stats.assigned < stats.total && (
              <span className="text-amber-500/80">
                · {stats.total - stats.assigned} sin asignar
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center rounded-lg border border-surface-700 overflow-hidden text-[10px]">
            {(["all", "assigned", "unassigned"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  filter === f
                    ? "bg-surface-700 text-surface-200"
                    : "text-surface-500 hover:text-surface-300"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-1 rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700">
              {["Imagen", "Estado", "Evaluadores asignados"].map((h) => (
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
            {filteredImages.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 px-3 text-center text-surface-600 italic">
                  No hay imágenes en esta vista.
                </td>
              </tr>
            )}
            {filteredImages.map((img) => {
              const current = assignmentMap.get(img) ?? [];
              const assignedIds = new Set(current.map((a) => a.evaluator_id));
              const available = assignable.filter((e) => !assignedIds.has(e.id));
              const isAnySaving = saving === img || current.some((a) => saving === `${img}:${a.evaluator_id}`);

              return (
                <tr
                  key={img}
                  className={`border-b border-surface-800 transition-colors ${
                    isAnySaving ? "opacity-50" : "hover:bg-surface-800/40"
                  }`}
                >
                  {/* Image filename */}
                  <td className="py-3 px-3 align-top">
                    <span className="font-mono text-surface-300">{img}</span>
                  </td>

                  {/* Status badge */}
                  <td className="py-3 px-3 align-top">
                    {current.length > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-teal-400/20 bg-teal-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                        Asignada
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-surface-600 bg-surface-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                        Sin asignar
                      </span>
                    )}
                  </td>

                  {/* Evaluators list + add */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex flex-col gap-2">
                      {/* Chips for each assigned evaluator */}
                      {current.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {current.map((a) => {
                            const isRemoving = saving === `${img}:${a.evaluator_id}`;
                            return (
                              <span
                                key={a.evaluator_id}
                                className="inline-flex items-center gap-1 rounded-full border border-surface-600 bg-surface-800 px-2 py-0.5 text-[11px] text-surface-300"
                              >
                                {a.evaluator_name}
                                <button
                                  onClick={() => handleRemove(img, a.evaluator_id)}
                                  disabled={isRemoving || isAnySaving}
                                  title="Quitar evaluador"
                                  className="ml-0.5 text-surface-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed leading-none"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Add evaluator row */}
                      {available.length > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={addSelections[img] ?? ""}
                            onChange={(e) =>
                              setAddSelections((prev) => ({ ...prev, [img]: e.target.value }))
                            }
                            disabled={isAnySaving}
                            className="text-xs bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5 text-surface-400 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-w-35"
                          >
                            <option value="">+ Añadir evaluador</option>
                            {available.map((ev) => (
                              <option key={ev.id} value={ev.id}>
                                {ev.name}
                              </option>
                            ))}
                          </select>
                          {addSelections[img] && (
                            <button
                              onClick={() => handleAdd(img)}
                              disabled={isAnySaving}
                              className="text-[10px] px-2 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                              Asignar
                            </button>
                          )}
                          {isAnySaving && (
                            <span className="text-[10px] text-surface-600 italic">Guardando...</span>
                          )}
                        </div>
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
