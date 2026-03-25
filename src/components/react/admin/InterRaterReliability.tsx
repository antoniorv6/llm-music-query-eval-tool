import { useMemo } from "react";
import type { AnalyticsData } from "../../../lib/analytics";

interface Props {
  data: AnalyticsData;
}

function alphaColor(alpha: number): string {
  if (alpha >= 0.8) return "#10B981";
  if (alpha >= 0.667) return "#4ECDC4";
  if (alpha >= 0.4) return "#F59E0B";
  return "#F43F5E";
}

function alphaLabel(alpha: number, nEvaluators: number): string {
  if (nEvaluators < 2) return "Requiere 2+ evaluadores";
  if (alpha >= 0.8) return "Excelente";
  if (alpha >= 0.667) return "Aceptable";
  if (alpha >= 0.4) return "Moderada";
  return "Baja";
}

function agreementBg(value: number): string {
  const r = Math.round(255 * (1 - value));
  const g = Math.round(200 * value);
  const b = Math.round(140 * value);
  return `rgba(${r}, ${g}, ${b}, 0.3)`;
}

export function InterRaterReliability({ data }: Props) {
  const { interRater, evaluators } = data;
  const nEvaluators = evaluators.length;

  const globalAlpha = interRater.krippendorffAlpha;

  const questionAlphaEntries = useMemo(
    () => Object.entries(interRater.alphaPerQuestion).sort(([a], [b]) => a.localeCompare(b)),
    [interRater.alphaPerQuestion]
  );

  const typeAlphaEntries = useMemo(
    () => Object.entries(interRater.alphaPerQuestionType),
    [interRater.alphaPerQuestionType]
  );

  const evaluatorNames: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    for (const ev of evaluators) m[ev.id] = ev.name;
    return m;
  }, [evaluators]);

  if (nEvaluators < 2) {
    return (
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Fiabilidad inter-evaluador
          </h3>
        </div>
        <p className="text-sm text-surface-500 italic">
          Se requieren al menos 2 evaluadores para calcular la fiabilidad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Global alpha hero */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Alpha de Krippendorff global
          </h3>
        </div>
        <div className="flex items-end gap-4">
          <span
            className="font-serif text-5xl font-semibold tabular-nums leading-none"
            style={{ color: alphaColor(globalAlpha) }}
          >
            {globalAlpha.toFixed(3)}
          </span>
          <div className="pb-1">
            <span
              className="text-sm font-semibold"
              style={{ color: alphaColor(globalAlpha) }}
            >
              {alphaLabel(globalAlpha, nEvaluators)}
            </span>
            <p className="text-xs text-surface-500 mt-0.5">
              Escala intervalo · {nEvaluators} evaluadores
            </p>
          </div>
        </div>
        {/* Alpha bar */}
        <div className="mt-4 h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(0, Math.min(100, globalAlpha * 100))}%`,
              backgroundColor: alphaColor(globalAlpha),
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-surface-600 mt-1">
          <span>0</span>
          <span>0.4</span>
          <span>0.667</span>
          <span>0.8</span>
          <span>1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Per-question alpha */}
        {questionAlphaEntries.length > 0 && (
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
                Alpha por pregunta
              </h3>
            </div>
            <div className="space-y-3">
              {questionAlphaEntries.map(([qId, alpha]) => (
                <div key={qId}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-surface-400">Q{qId}</span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: alphaColor(alpha) }}
                    >
                      {alpha.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, alpha * 100))}%`,
                        backgroundColor: alphaColor(alpha),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-type alpha */}
        {typeAlphaEntries.length > 0 && (
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
              <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
                Alpha por tipo
              </h3>
            </div>
            <div className="space-y-3">
              {typeAlphaEntries.map(([type, alpha]) => (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-surface-400 capitalize">
                      {type}
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: alphaColor(alpha) }}
                    >
                      {alpha.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, alpha * 100))}%`,
                        backgroundColor: alphaColor(alpha),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pairwise agreement heatmap */}
      {interRater.pairwiseAgreement.length > 0 && (
        <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
              Acuerdo pairwise (% exacto)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-2" />
                  {evaluators.map((ev) => (
                    <th key={ev.id} className="p-2 text-surface-400 font-medium text-center">
                      {ev.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluators.map((ev1) => (
                  <tr key={ev1.id}>
                    <td className="p-2 text-surface-400 font-medium pr-4">{ev1.name}</td>
                    {evaluators.map((ev2) => {
                      if (ev1.id === ev2.id) {
                        return (
                          <td
                            key={ev2.id}
                            className="p-2 text-center"
                            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                          >
                            <span className="text-surface-600">—</span>
                          </td>
                        );
                      }
                      const pair = interRater.pairwiseAgreement.find(
                        (p) =>
                          (p.evaluator1 === ev1.id && p.evaluator2 === ev2.id) ||
                          (p.evaluator1 === ev2.id && p.evaluator2 === ev1.id)
                      );
                      const agreement = pair?.agreement ?? 0;
                      return (
                        <td
                          key={ev2.id}
                          className="p-2 text-center tabular-nums font-mono"
                          style={{ backgroundColor: agreementBg(agreement) }}
                        >
                          <span className="text-surface-200">
                            {(agreement * 100).toFixed(0)}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
