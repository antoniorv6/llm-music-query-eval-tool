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

  const assignmentMap = useMemo(() => {
    const map = new Map<string, { evaluator_id: string; evaluator_name: string }>();
    for (const a of assignments) {
      map.set(a.image_filename, {
        evaluator_id: a.evaluator_id,
        evaluator_name: a.evaluator_name,
      });
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

  async function handleChange(imageFilename: string, evaluatorId: string) {
    setSaving(imageFilename);
    if (!evaluatorId) {
      await unassignImage(imageFilename);
    } else {
      await assignImage(imageFilename, evaluatorId);
    }
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
              {["Imagen", "Estado", "Evaluador asignado"].map((h) => (
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
              const current = assignmentMap.get(img);
              const isSaving = saving === img;
              return (
                <tr
                  key={img}
                  className={`border-b border-surface-800 transition-colors ${
                    isSaving ? "opacity-50" : "hover:bg-surface-800/40"
                  }`}
                >
                  {/* Image filename */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-surface-300">{img}</span>
                  </td>

                  {/* Status badge */}
                  <td className="py-3 px-3">
                    {current ? (
                      <span className="inline-flex items-center rounded-full border border-teal-400/20 bg-teal-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                        Asignada
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-surface-600 bg-surface-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                        Sin asignar
                      </span>
                    )}
                  </td>

                  {/* Evaluator select */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={current?.evaluator_id ?? ""}
                        onChange={(e) => handleChange(img, e.target.value)}
                        disabled={isSaving}
                        className="text-xs bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5 text-surface-200 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px]"
                      >
                        <option value="">Sin asignar</option>
                        {assignable.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name}
                          </option>
                        ))}
                      </select>
                      {isSaving && (
                        <span className="text-[10px] text-surface-600 italic">Guardando...</span>
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
